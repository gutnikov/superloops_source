/**
 * Contract specs of the fixtures in support/fixtures.ts: each one checks the state its TSDoc promises, and
 * nothing more. Project fixture-contracts (`npm run test:fixtures`), apart from the acceptance tests.
 * The site's fixtures (siteBuilt, siteLive, cloudflareDeploys, siteWithImage) stay red until site/ builds.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { readCatalog } from '../support/catalog.ts';
import { expect, test } from '../support/fixtures.ts';

const TAG = '@fixture-contract';

/**
 * The plugin's own check of a catalog folder: scripts/catalog.py check, run on that folder's copy of it, the way
 * loops/FORMAT.md runs it. Not with -I: the check needs PyYAML, which may be installed in the user's site-packages.
 * The script is the plugin's own, copied from this repository.
 */
function catalogCheck(dir: string): { code: number | null; errors: string[] } {
  const run = spawnSync('python3', [path.join(dir, 'scripts', 'catalog.py'), 'check'], { encoding: 'utf8' });
  const errors = run.stdout.trim().split('\n').filter((line) => line && !line.startsWith('OK:'));
  // A crash prints no error line, only a traceback: keep its last line, so the contract shows why.
  if (run.status !== 0 && !errors.length) errors.push(run.stderr.trim().split('\n').pop() ?? `exit ${run.status}`);
  return { code: run.status, errors };
}

/** What the check says of a broken card besides the card: the files it generates from the cards are out of date. */
const GENERATED_OUT_OF_DATE = /^(loops\/index\.yaml is out of date|the list of loops in loops\/README\.md is out of date)/;

/** The check's errors about the card `card` (relative to the catalog folder), and about anything else. */
function errorsAbout(errors: string[], card: string) {
  return {
    aboutTheCard: errors.some((e) => e.startsWith(`${card}: `)),
    others: errors.filter((e) => !e.startsWith(`${card}: `) && !GENERATED_OUT_OF_DATE.test(e)),
  };
}

/**
 * Contract: catalogOnMain holds what the state's note says: 96 loop cards, one folder each (loops/<id>/card.md, none
 * with an image), and 4 super-loop cards.
 */
test('contract: catalogOnMain is the catalog of plugin/parts/harness', { tag: TAG }, async ({ catalogOnMain }) => {
  expect({
    loopCards: catalogOnMain.loopTypes.length,
    notInTheirFolder: catalogOnMain.loopTypes.filter((card) => card.path !== `loops/${card.id}/card.md`).map((card) => card.path),
    withAnImage: catalogOnMain.loopTypes.filter((card) => card.image !== undefined).map((card) => card.path),
    superLoopIds: catalogOnMain.superLoops.map((card) => card.id),
  }).toEqual({
    loopCards: 96,
    notInTheirFolder: [],
    withAnImage: [],
    superLoopIds: ['delivery', 'discovery', 'maintenance', 'remediation'],
  });
});

/** Contract: the catalog catalogValid hands to the build passes the plugin's check. */
test('contract: catalogValid passes the catalog check', { tag: TAG }, async ({ catalogValid }) => {
  expect(catalogCheck(catalogValid.dir)).toEqual({ code: 0, errors: [] });
});

/** Contract: the copy fails the plugin's check, for the broken loop card and nothing else. */
test('contract: catalogWithInvalidCard breaks one loop card', { tag: TAG }, async ({ catalogWithInvalidCard }) => {
  const { code, errors } = catalogCheck(catalogWithInvalidCard.dir);
  expect({ code, ...errorsAbout(errors, catalogWithInvalidCard.card) }).toEqual({ code: 1, aboutTheCard: true, others: [] });
});

test.describe('with a super-loop card broken', () => {
  test.use({ invalidCard: 'super-loops/remediation.md' });

  /** Contract: the copy fails the plugin's check, for the broken super-loop card and nothing else. */
  test(
    'contract: catalogWithInvalidCard breaks one super-loop card',
    { tag: TAG },
    async ({ catalogWithInvalidCard }) => {
      const { code, errors } = catalogCheck(catalogWithInvalidCard.dir);
      expect({ code, ...errorsAbout(errors, catalogWithInvalidCard.card) }).toEqual({ code: 1, aboutTheCard: true, others: [] });
    },
  );
});

/**
 * Contract: in the copy, loops/red-green-tdd/ has image.svg and its card says so, no other card has an image, and the
 * copy passes the plugin's check.
 */
test('contract: catalogWithImage gives one card an image', { tag: TAG }, async ({ catalogWithImage }) => {
  const withAnImage = readCatalog(catalogWithImage.dir)
    .loopTypes.filter((card) => card.image !== undefined)
    .map((card) => ({ card: card.path, image: path.posix.join(path.posix.dirname(card.path), card.image!) }));
  expect({
    withAnImage,
    imageFileIsThere: fs.existsSync(path.join(catalogWithImage.dir, catalogWithImage.image)),
    check: catalogCheck(catalogWithImage.dir),
  }).toEqual({
    withAnImage: [{ card: 'loops/red-green-tdd/card.md', image: 'loops/red-green-tdd/image.svg' }],
    imageFileIsThere: true,
    check: { code: 0, errors: [] },
  });
});

/** Contract: siteBuilt's folder holds a built site: its home page. */
test('contract: siteBuilt has a built site', { tag: TAG }, async ({ siteBuilt }) => {
  expect(fs.existsSync(path.join(siteBuilt.outDir, 'index.html'))).toBe(true);
});

/** Contract: siteLive serves a site that states its version. */
test('contract: siteLive serves a version', { tag: TAG }, async ({ siteLive }) => {
  expect(siteLive.version).toMatch(/^[0-9a-f]{7,40}$/);
});

/** Contract: siteWithImage serves a site built from catalogWithImage: the page of the card that has the image. */
test('contract: siteWithImage serves the site built from catalogWithImage', { tag: TAG }, async ({ siteWithImage }) => {
  expect((await fetch(`${siteWithImage.url}/loops/red-green-tdd/`)).status).toBe(200);
});

/** Contract: what cloudflareDeploys serves answers on its home page. */
test('contract: cloudflareDeploys serves the site', { tag: TAG }, async ({ cloudflareDeploys }) => {
  expect((await fetch(`${cloudflareDeploys.url}/`)).status).toBe(200);
});

/**
 * Contract (stub): cloudflareFails will produce a deploy that Cloudflare refused, with superloops.dev still on
 * the previous site. TODO: turn into a test when the fixture can force a failed deploy (see its TSDoc).
 */
test.fixme('contract: cloudflareFails refuses the deploy', { tag: TAG }, async ({ cloudflareFails }) => {
  expect(cloudflareFails.error).toBe('DeployFailed');
});
