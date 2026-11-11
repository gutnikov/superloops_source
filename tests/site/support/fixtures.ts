/**
 * The states and the outside outcomes of superloops/specs/model/site.em.yaml, one fixture each, named as in the
 * contract (event-model/1), and the Page Objects named in its screens[].pom.
 *
 *   catalogOnMain              the repository's catalog, plugin/parts/harness, read card by card
 *     └─ siteBuilt             + the site built from it: `npm run build` in site/, into a folder of its own
 *          └─ siteLive         + that site served, the way superloops.dev serves the previous commit's site
 *
 *   catalogValid               Catalog -> valid: the build reads the repository's catalog, unchanged
 *   catalogWithInvalidCard     Catalog -> invalid: a copy of plugin/parts with one card's title emptied
 *   catalogWithImage           Catalog -> withImage: a copy of plugin/parts where loops/red-green-tdd/ has an image
 *     └─ siteWithImage         + the site built from that copy, served locally
 *   cloudflareDeploys          Cloudflare -> deploys: the built site is what is served
 *   cloudflareFails            Cloudflare -> fails: a stub, it cannot be forced from a test
 *
 * Where the pages are: SITE_BASE_URL when it is set (the deployed site, e.g. https://superloops.dev), else a local
 * static server over the siteBuilt build. The Page Object fixtures hand it to the Page Objects. (Not through
 * Playwright's baseURL: every test reads that option, so every test would build the site.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { test as base, type Request } from '@playwright/test';
import { HomePage } from '../pages/home-page.ts';
import { LoopTypePage } from '../pages/loop-type-page.ts';
import { SuperLoopPage } from '../pages/super-loop-page.ts';
import { VersionFile } from '../pages/version-file.ts';
import { buildSite, tail } from './build.ts';
import { readCatalog, type Catalog } from './catalog.ts';
import { CATALOG_DIR, SITE_BASE_URL } from './repo.ts';
import { serveFolder } from './serve.ts';

export type CatalogFolder = { dir: string };
export type InvalidCatalog = CatalogFolder & {
  /** The broken card's path relative to the catalog folder, e.g. loops/red-green-tdd/card.md. */
  card: string;
};
export type CatalogWithImage = CatalogFolder & {
  /** The card that has the image, relative to the catalog folder: loops/red-green-tdd/card.md. */
  card: string;
  /** The image, relative to the catalog folder: loops/red-green-tdd/image.svg. */
  image: string;
};
export type BuiltSite = Catalog & { outDir: string };
export type LiveSite = BuiltSite & { url: string; version: string };
export type ServedSite = { url: string };
export type ServedBuild = ServedSite & { outDir: string };

type WorkerFixtures = {
  catalogOnMain: Catalog;
  siteBuilt: BuiltSite;
  servedSite: ServedSite;
  siteLive: LiveSite;
};

type TestFixtures = {
  invalidCard: string;
  catalogValid: CatalogFolder;
  catalogWithInvalidCard: InvalidCatalog;
  catalogWithImage: CatalogWithImage;
  siteWithImage: ServedBuild;
  cloudflareDeploys: ServedSite;
  cloudflareFails: { error: 'DeployFailed' };
  siteUnderTest: string;
  homePage: HomePage;
  loopTypePage: LoopTypePage;
  superLoopPage: SuperLoopPage;
  versionFile: VersionFile;
};

const BUILD_TIMEOUT = 5 * 60_000;

/** Where the beacon of Cloudflare Web Analytics loads from and reports to. */
const ANALYTICS = /^https:\/\/([a-z0-9-]+\.)*cloudflareinsights\.com\//;

/** The card catalogWithImage gives an image, and the image: the example "a card's image illustrates its page". */
const IMAGE_CARD = 'loops/red-green-tdd/card.md';
const IMAGE_FILE = 'image.svg';

/**
 * The bytes of the image catalogWithImage adds: a plain SVG, far below the plugin's limit of 300 KB. It has a size
 * of its own, so a browser that shows it gives it a natural width (LoopTypePage checks that the picture loaded).
 */
const IMAGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120">\n' +
  '  <rect width="120" height="120" fill="#c62828"/>\n' +
  '  <rect x="120" width="120" height="120" fill="#2e7d32"/>\n' +
  '</svg>\n';

/**
 * A copy of the whole of plugin/parts under `into`, and the path of its harness/ (the catalog folder) in it. Not
 * only harness/: cards link to other parts (../../../event-model/…), and a partial copy would break those links.
 */
function copyCatalog(catalogDir: string, into: string): string {
  fs.cpSync(path.dirname(catalogDir), into, { recursive: true });
  return path.join(into, path.basename(catalogDir));
}

/**
 * Rewrites the file `rel` of the catalog copy `dir` with `change`. Throws when it comes out unchanged: the card is
 * not what the fixture expects (no title line to empty, an image already there), so the state is not produced.
 */
function rewrite(dir: string, rel: string, change: (source: string) => string, fixture: string) {
  const file = path.join(dir, rel);
  const source = fs.readFileSync(file, 'utf8');
  const changed = change(source);
  if (changed === source) throw new Error(`${fixture}: ${rel} came out unchanged; the card is not what ${fixture} expects`);
  fs.writeFileSync(file, changed);
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  /**
   * State catalogOnMain: the repository at a commit of main, the catalog as it is in plugin/parts/harness. The
   * note: 96 loop cards, one folder each (loops/<id>/card.md, none with an image), and 4 super-loop cards (delivery,
   * discovery, maintenance, remediation; README.md and harness-level.md of super-loops/ are documents, not cards).
   * The cards read here are the expected values of every page test.
   *
   * Read from the working tree, not from git: the tests run on the commit they check. A super-loop card is a file
   * of super-loops/ with frontmatter; the two documents have none, as the plugin's catalog.py tells them apart.
   */
  catalogOnMain: [
    async ({}, use) => {
      await use(readCatalog(CATALOG_DIR));
    },
    { scope: 'worker' },
  ],

  /**
   * State siteBuilt: the site built from catalogOnMain, not deployed. The build reads the repository's catalog
   * by default (no SUPERLOOPS_CATALOG) and writes into a folder of this worker under test-results/, so a build of
   * another catalog never overwrites it.
   *
   * Built once per worker: a build takes seconds, and every page test reads the same one. Throws when the build
   * fails: the state cannot be produced then, and the tests that need it fail at their setup with the build's
   * output. The folder is kept after the run for a look at what was built.
   */
  siteBuilt: [
    async ({ catalogOnMain }, use, workerInfo) => {
      const outDir = path.join(workerInfo.project.outputDir, 'builds', `site-built-w${workerInfo.workerIndex}`);
      fs.rmSync(outDir, { recursive: true, force: true });
      const build = await buildSite({ outDir });
      if (build.code !== 0) {
        throw new Error(
          `siteBuilt: the site did not build (\`npm run build\` in site/ exited ${build.code}):\n${tail(build.output)}`,
        );
      }
      await use({ ...catalogOnMain, outDir });
    },
    { scope: 'worker', timeout: BUILD_TIMEOUT },
  ],

  /**
   * Where the pages are: SITE_BASE_URL when set, else the siteBuilt folder behind a local static server. Not a
   * state of the spec: it is what siteLive and cloudflareDeploys serve, and what the Page Objects open.
   *
   * With SITE_BASE_URL the site is still built locally (siteBuilt is in the chain), but every page opened is on
   * SITE_BASE_URL.
   */
  servedSite: [
    async ({ siteBuilt }, use) => {
      if (SITE_BASE_URL) return use({ url: SITE_BASE_URL });
      const server = await serveFolder(siteBuilt.outDir);
      await use({ url: server.url });
      await server.close();
    },
    { scope: 'worker' },
  ],

  /**
   * State siteLive: the site is served, as superloops.dev serves the site of the previous commit of main.
   * Locally that is the siteBuilt build behind the static server; with SITE_BASE_URL it is the deployed site.
   * `version` is what its /version.txt said when the state was produced.
   *
   * Used by the tests where a new build or deploy fails: what they leave untouched is this site.
   */
  siteLive: [
    async ({ siteBuilt, servedSite }, use) => {
      const response = await fetch(`${servedSite.url}/version.txt`);
      if (!response.ok) {
        throw new Error(`siteLive: ${servedSite.url}/version.txt answered ${response.status}; no site is live there`);
      }
      await use({ ...siteBuilt, url: servedSite.url, version: (await response.text()).trim() });
    },
    { scope: 'worker' },
  ],

  /** Which card catalogWithInvalidCard breaks, relative to the catalog folder: the card the T01 examples name. */
  invalidCard: ['loops/red-green-tdd/card.md', { option: true }],

  /**
   * Catalog -> valid: the catalog the build reads is the repository's own, unchanged, which the plugin's check
   * passes (its contract spec). siteBuilt and the served pages are built from exactly this folder.
   */
  catalogValid: async ({ catalogOnMain }, use) => {
    await use({ dir: catalogOnMain.dir });
  },

  /**
   * Catalog -> invalid: a copy of the real catalog with one card the site cannot show: the card `invalidCard`
   * (option) gets an empty title (`title: ""`), so its page would have no title. The plugin's own check
   * (scripts/catalog.py check) rejects the copy for that card, and otherwise only says that the files it generates
   * from the titles are out of date (its contract spec).
   *
   * Emptied, not removed: the check crashes on a loop card with no title line (KeyError in build_list, checked on
   * 2026-11-11), so it would not say which card it rejects. For the site both are a card with no title to show.
   * The copy is per test, under the test's output folder; hand its `dir` to the build as SUPERLOOPS_CATALOG.
   */
  catalogWithInvalidCard: async ({ catalogOnMain, invalidCard }, use, testInfo) => {
    const dir = copyCatalog(catalogOnMain.dir, testInfo.outputPath('parts'));
    rewrite(
      dir,
      invalidCard,
      (source) => source.replace(/^(---\n[\s\S]*?)^title: .*\n/m, '$1title: ""\n'),
      'catalogWithInvalidCard',
    );
    await use({ dir, card: invalidCard });
  },

  /**
   * Catalog -> withImage: a copy of the real catalog where loops/red-green-tdd/ also has image.svg, and its card says
   * `image: image.svg` (after its summary, where loops/FORMAT.md lists the field). Nothing else changes, and the copy
   * passes the plugin's own check (its contract spec). The example "a card's image illustrates its page" needs it:
   * no card of the repository has an image.
   *
   * A copy of the whole of plugin/parts, per test, under the test's output folder; hand its `dir` to the build as
   * SUPERLOOPS_CATALOG.
   */
  catalogWithImage: async ({ catalogOnMain }, use, testInfo) => {
    const dir = copyCatalog(catalogOnMain.dir, testInfo.outputPath('parts'));
    const image = path.posix.join(path.posix.dirname(IMAGE_CARD), IMAGE_FILE);
    rewrite(
      dir,
      IMAGE_CARD,
      (source) => (/^image:/m.test(source) ? source : source.replace(/^(---\n[\s\S]*?^summary: .*\n)/m, `$1image: ${IMAGE_FILE}\n`)),
      'catalogWithImage',
    );
    fs.writeFileSync(path.join(dir, image), IMAGE_SVG);
    await use({ dir, card: IMAGE_CARD, image });
  },

  /**
   * The site built from catalogWithImage and served locally: what the example "a card's image illustrates its page"
   * opens. Local also when SITE_BASE_URL is set: superloops.dev is built from the repository's catalog, where no card
   * has an image. Built per test into the test's output folder, through the same seams as siteBuilt (SUPERLOOPS_CATALOG,
   * SITE_OUT_DIR). Throws when the build fails: the example cannot be checked then, and its test fails at setup with
   * the build's output.
   */
  siteWithImage: [
    async ({ catalogWithImage }, use, testInfo) => {
      const outDir = testInfo.outputPath('build');
      const build = await buildSite({ catalog: catalogWithImage.dir, outDir });
      if (build.code !== 0) {
        throw new Error(
          `siteWithImage: the site did not build from catalogWithImage (\`npm run build\` in site/ exited ${build.code}):\n${tail(build.output)}`,
        );
      }
      const server = await serveFolder(outDir);
      testInfo.annotations.push({ type: 'site under test', description: `${server.url} (built from catalogWithImage)` });
      await use({ url: server.url, outDir });
      await server.close();
    },
    { timeout: BUILD_TIMEOUT },
  ],

  /**
   * Cloudflare -> deploys: the site built from this commit is what the visitor gets. Locally, the siteBuilt
   * folder served the way Cloudflare serves it; with SITE_BASE_URL, the deploy the release made, on that URL.
   * The tests never deploy: the release does, then runs them with SITE_BASE_URL.
   */
  cloudflareDeploys: async ({ siteBuilt: _siteBuilt, servedSite }, use) => {
    await use({ url: servedSite.url });
  },

  /**
   * Blocked: Cloudflare -> fails cannot be forced from a test. Locally there is no Cloudflare to refuse a deploy;
   * on superloops.dev it would take a real deploy made to fail (a revoked token, a missing project), done by the
   * tests against production, which they must not do. Checked on 2026-11-11: no wrangler and no Cloudflare token
   * in this repository or its session (superloops/hitl-log.jsonl, setup). Unblocks with a Cloudflare project
   * that is not production, whose deploys a test may break, and a deploy seam for it.
   */
  cloudflareFails: async ({}, use) => {
    void use;
    throw new Error('cloudflareFails fixture not implemented — a failed Cloudflare deploy cannot be forced from a test');
  },

  /**
   * Pages of a local build do not load the beacon: a page view of 127.0.0.1 is not one of superloops.dev. That is
   * every page of a local run, and siteWithImage's pages in a run against SITE_BASE_URL. On SITE_BASE_URL it loads,
   * and its page views are the production signal of SITE-1#1-#3 (SITE-1?4).
   */
  page: async ({ page }, use) => {
    await page.route(ANALYTICS, (route) => (isOnSiteBaseUrl(route.request()) ? route.fallback() : route.abort()));
    await use(page);
  },

  /** The site the Page Objects open; recorded on each test that uses one, so the report says what was checked. */
  siteUnderTest: async ({ servedSite }, use, testInfo) => {
    testInfo.annotations.push({ type: 'site under test', description: servedSite.url });
    await use(servedSite.url);
  },

  homePage: async ({ page, siteUnderTest }, use) => use(new HomePage(page, siteUnderTest)),
  loopTypePage: async ({ page, siteUnderTest }, use) => use(new LoopTypePage(page, siteUnderTest)),
  superLoopPage: async ({ page, siteUnderTest }, use) => use(new SuperLoopPage(page, siteUnderTest)),
  versionFile: async ({ page, siteUnderTest }, use) => use(new VersionFile(page, siteUnderTest)),
});

/** Whether the page that made this request is on SITE_BASE_URL (unset: never). */
function isOnSiteBaseUrl(request: Request): boolean {
  if (!SITE_BASE_URL) return false;
  try {
    return request.frame().url().startsWith(`${SITE_BASE_URL}/`);
  } catch {
    return false;
  }
}

export { expect } from '@playwright/test';
