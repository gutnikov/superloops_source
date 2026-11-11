/**
 * T02 Publish the super-loops (translation; external: Catalog). Requirement SITE-1#3.
 * Examples: superloops/specs/model/site.em.yaml, slice T02; values quoted from the contract (event-model/1).
 */
import { buildSite, expectCardInvalid } from '../support/build.ts';
import { expect, test } from '../support/fixtures.ts';
import type { SuperLoopExample } from '../pages/super-loop-page.ts';

const TAGS = ['@T02', '@SITE-1#3'];

/** The see of "every super-loop card has a page with what the card holds", as the contract states it. */
const EXAMPLE: SuperLoopExample = {
  title: 'Remediation: from a problem to a fix confirmed in use',
  phases: 'entry, oracle, work, gate, release, confirmation',
  exits: 'confirmed, not-confirmed, inconclusive, mitigated',
  // "…, with the card's text": the text is checked by expectCard.
  sectionNames: [
    'Super-loop',
    'Oracle',
    'Phases',
    'Gate',
    'Confirmation',
    'Exits',
    'Trace',
    'When a project needs it',
    'Sources',
  ],
};

// The invalid card here is the super-loop card the example above names.
test.use({ invalidCard: 'super-loops/remediation.md' });

test(
  'every super-loop card has a page with what the card holds',
  { tag: TAGS },
  async ({ catalogOnMain, catalogValid: _catalogValid, superLoopPage }) => {
    const exampleCard = catalogOnMain.superLoops.find((card) => card.title.source === EXAMPLE.title);
    expect(exampleCard, `a super-loop card titled "${EXAMPLE.title}" is in the catalog`).toBeDefined();

    await test.step(`the example's card: ${exampleCard!.path}`, async () => {
      expect.soft(await superLoopPage.open(exampleCard!.id), `/super-loops/${exampleCard!.id}/ is served`).toBe(200);
      await superLoopPage.expectExample(EXAMPLE);
    });

    // "every super-loop card": all of them, not a sample.
    for (const card of catalogOnMain.superLoops) {
      await test.step(card.path, async () => {
        expect.soft(await superLoopPage.open(card.id), `/super-loops/${card.id}/ is served`).toBe(200);
        await superLoopPage.expectCard(card);
      });
    }
  },
);

test(
  'a super-loop card the site cannot show stops the build',
  { tag: TAGS },
  async ({ siteLive: _siteLive, catalogWithInvalidCard }, testInfo) => {
    const build = await buildSite({ catalog: catalogWithInvalidCard.dir, outDir: testInfo.outputPath('build') });
    expectCardInvalid(build, catalogWithInvalidCard.card);
  },
);
