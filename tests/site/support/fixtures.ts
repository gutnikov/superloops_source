/**
 * The states and the outside outcomes of superloops/specs/model/site.em.yaml, one fixture each, named as in the
 * contract (event-model/1), and the Page Objects named in its screens[].pom.
 *
 *   catalogOnMain              the repository's catalog, plugin/parts/harness, read card by card
 *     └─ siteBuilt             + the site built from it: `npm run build` in site/, into a folder of its own
 *          └─ siteLive         + that site served, the way superloops.dev serves the previous commit's site
 *
 *   catalogValid               Catalog -> valid: the build reads the repository's catalog, unchanged
 *   catalogWithInvalidCard     Catalog -> invalid: a copy of plugin/parts with one card's title removed
 *   cloudflareDeploys          Cloudflare -> deploys: the built site is what is served
 *   cloudflareFails            Cloudflare -> fails: a stub, it cannot be forced from a test
 *
 * Where the pages are: SITE_BASE_URL when it is set (the deployed site, e.g. https://superloops.dev), else a local
 * static server over the siteBuilt build. The Page Object fixtures hand it to the Page Objects. (Not through
 * Playwright's baseURL: every test reads that option, so every test would build the site.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { test as base } from '@playwright/test';
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
  /** The broken card's path relative to the catalog folder, e.g. loop-types/testing/red-green-tdd.md. */
  card: string;
};
export type BuiltSite = Catalog & { outDir: string };
export type LiveSite = BuiltSite & { url: string; version: string };
export type ServedSite = { url: string };

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
  cloudflareDeploys: ServedSite;
  cloudflareFails: { error: 'DeployFailed' };
  siteUnderTest: string;
  homePage: HomePage;
  loopTypePage: LoopTypePage;
  superLoopPage: SuperLoopPage;
  versionFile: VersionFile;
};

const BUILD_TIMEOUT = 5 * 60_000;

export const test = base.extend<TestFixtures, WorkerFixtures>({
  /**
   * State catalogOnMain: the repository at a commit of main, the catalog as it is in plugin/parts/harness. The
   * note: 96 loop-type cards in 12 groups, and 4 super-loop cards (delivery, discovery, maintenance, remediation;
   * README.md and harness-level.md of super-loops/ are documents, not cards). The cards read here are the
   * expected values of every page test.
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

  /** Which card catalogWithInvalidCard breaks, relative to the catalog folder: the card the T01 example names. */
  invalidCard: ['loop-types/testing/red-green-tdd.md', { option: true }],

  /**
   * Catalog -> valid: the catalog the build reads is the repository's own, unchanged, which the plugin's check
   * passes (its contract spec). siteBuilt and the served pages are built from exactly this folder.
   */
  catalogValid: async ({ catalogOnMain }, use) => {
    await use({ dir: catalogOnMain.dir });
  },

  /**
   * Catalog -> invalid: a copy of the real catalog with one card the site cannot show: the card `invalidCard`
   * (option) loses the title line of its frontmatter, so its page would have no title. The plugin's own check
   * (scripts/catalog.py check) rejects the copy for that card and nothing else (its contract spec).
   *
   * The whole of plugin/parts is copied, not only harness/: cards link to other parts (../../../app-probing/…),
   * and a partial copy would break those links and fail for another reason. The copy is per test, under the
   * test's output folder; hand its `dir` to the build as SUPERLOOPS_CATALOG.
   */
  catalogWithInvalidCard: async ({ catalogOnMain, invalidCard }, use, testInfo) => {
    const parts = testInfo.outputPath('parts');
    fs.cpSync(path.dirname(catalogOnMain.dir), parts, { recursive: true });
    const dir = path.join(parts, path.basename(catalogOnMain.dir));
    const file = path.join(dir, invalidCard);
    const source = fs.readFileSync(file, 'utf8');
    const broken = source.replace(/^(---\n[\s\S]*?)^title: .*\n/m, '$1');
    if (broken === source) throw new Error(`catalogWithInvalidCard: ${invalidCard} has no title line to remove`);
    fs.writeFileSync(file, broken);
    await use({ dir, card: invalidCard });
  },

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
   * Local runs do not load the beacon: a page view of 127.0.0.1 is not one of superloops.dev. Against
   * SITE_BASE_URL it loads, and its page views are the production signal of SITE-1#1-#3 (SITE-1?4).
   */
  page: async ({ page }, use) => {
    if (!SITE_BASE_URL) await page.route(/^https:\/\/([a-z0-9-]+\.)*cloudflareinsights\.com\//, (route) => route.abort());
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

export { expect } from '@playwright/test';
