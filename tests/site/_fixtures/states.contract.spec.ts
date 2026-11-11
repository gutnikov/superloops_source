/**
 * Contract specs of the fixtures in support/fixtures.ts: each one checks the state its TSDoc promises, and
 * nothing more. Project fixture-contracts (`npm run test:fixtures`), apart from the acceptance tests.
 * The site's fixtures (siteBuilt, siteLive, cloudflareDeploys) stay red until site/ builds.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '../support/fixtures.ts';

const TAG = '@fixture-contract';

/** The plugin's own check of a catalog folder: scripts/catalog.py check, run on that folder's copy of it. */
function catalogCheck(dir: string): { code: number | null; errors: string[] } {
  const run = spawnSync('python3', ['-I', path.join(dir, 'scripts', 'catalog.py'), 'check'], { encoding: 'utf8' });
  return { code: run.status, errors: run.stdout.trim().split('\n').filter((line) => !line.startsWith('OK:')) };
}

/** Errors a broken card brings along that are not about the card itself. */
const INDEX_OUT_OF_DATE = /^index\.yaml is out of date/;

/** Contract: catalogOnMain holds what the state's note says: 96 loop types in 12 groups, 4 super-loop cards. */
test('contract: catalogOnMain is the catalog of plugin/parts/harness', { tag: TAG }, async ({ catalogOnMain }) => {
  expect({
    loopTypes: catalogOnMain.loopTypes.length,
    groups: catalogOnMain.groups.length,
    superLoopCards: catalogOnMain.superLoops.length,
    superLoopIds: catalogOnMain.superLoops.map((card) => card.id),
  }).toEqual({
    loopTypes: 96,
    groups: 12,
    superLoopCards: 4,
    superLoopIds: ['delivery', 'discovery', 'maintenance', 'remediation'],
  });
});

/** Contract: the catalog catalogValid hands to the build passes the plugin's check. */
test('contract: catalogValid passes the catalog check', { tag: TAG }, async ({ catalogValid }) => {
  expect(catalogCheck(catalogValid.dir)).toEqual({ code: 0, errors: [] });
});

/** Contract: the copy fails the plugin's check, for the broken loop-type card and nothing else. */
test(
  'contract: catalogWithInvalidCard breaks one loop-type card',
  { tag: TAG },
  async ({ catalogWithInvalidCard }) => {
    const { code, errors } = catalogCheck(catalogWithInvalidCard.dir);
    const name = path.basename(catalogWithInvalidCard.card);
    expect({ code, others: errors.filter((e) => !e.includes(name) && !INDEX_OUT_OF_DATE.test(e)), about: errors.some((e) => e.includes(name)) })
      .toEqual({ code: 1, others: [], about: true });
  },
);

test.describe('with a super-loop card broken', () => {
  test.use({ invalidCard: 'super-loops/remediation.md' });

  /** Contract: the copy fails the plugin's check, for the broken super-loop card and nothing else. */
  test(
    'contract: catalogWithInvalidCard breaks one super-loop card',
    { tag: TAG },
    async ({ catalogWithInvalidCard }) => {
      const { code, errors } = catalogCheck(catalogWithInvalidCard.dir);
      const name = path.basename(catalogWithInvalidCard.card);
      expect({ code, others: errors.filter((e) => !e.includes(name) && !INDEX_OUT_OF_DATE.test(e)), about: errors.some((e) => e.includes(name)) })
        .toEqual({ code: 1, others: [], about: true });
    },
  );
});

/** Contract: siteBuilt's folder holds a built site: its home page. */
test('contract: siteBuilt has a built site', { tag: TAG }, async ({ siteBuilt }) => {
  expect(fs.existsSync(path.join(siteBuilt.outDir, 'index.html'))).toBe(true);
});

/** Contract: siteLive serves a site that states its version. */
test('contract: siteLive serves a version', { tag: TAG }, async ({ siteLive }) => {
  expect(siteLive.version).toMatch(/^[0-9a-f]{7,40}$/);
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
