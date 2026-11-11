/**
 * T01 Publish the loop types (translation; external: Catalog). Requirements SITE-1#1, SITE-1#2.
 * Examples: superloops/specs/model/site.em.yaml, slice T01; values quoted from the contract (event-model/1).
 */
import { buildSite, expectCardInvalid } from '../support/build.ts';
import { expect, test } from '../support/fixtures.ts';
import type { LoopTypeExample } from '../pages/loop-type-page.ts';

const TAGS = ['@T01', '@SITE-1#1', '@SITE-1#2'];

/** The see of "every card of the catalog has a page with what the card holds", as the contract states it. */
const EXAMPLE: LoopTypeExample = {
  title: 'Unit tests, red/green TDD',
  group: 'testing',
  places: 'delivery/work, remediation/work',
  stages: 'local',
  qualities: 'testability, correctness',
  summary:
    'The agent writes a test and makes sure it fails (red). Then it writes the implementation until the run is green, and refactors.',
  // "Loop, Set up, Notes, Agent step, Related, Sources, with the card's text": the text is checked by expectCard.
  sectionNames: ['Loop', 'Set up', 'Notes', 'Agent step', 'Related', 'Sources'],
};

test(
  'every card of the catalog has a page with what the card holds',
  { tag: TAGS },
  async ({ catalogOnMain, catalogValid: _catalogValid, loopTypePage }) => {
    const exampleCard = catalogOnMain.loopTypes.find((card) => card.title.source === EXAMPLE.title);
    expect(exampleCard, `a card titled "${EXAMPLE.title}" is in the catalog`).toBeDefined();

    await test.step(`the example's card: ${exampleCard!.path}`, async () => {
      expect.soft(await loopTypePage.open(exampleCard!.id), `/loops/${exampleCard!.id}/ is served`).toBe(200);
      await loopTypePage.expectExample(EXAMPLE);
    });

    // "every card of the catalog": all of them, not a sample.
    for (const card of catalogOnMain.loopTypes) {
      await test.step(card.path, async () => {
        expect.soft(await loopTypePage.open(card.id), `/loops/${card.id}/ is served`).toBe(200);
        await loopTypePage.expectCard(card);
      });
    }
  },
);

test(
  'a card the site cannot show stops the build',
  { tag: TAGS },
  async ({ siteLive: _siteLive, catalogWithInvalidCard }, testInfo) => {
    const build = await buildSite({ catalog: catalogWithInvalidCard.dir, outDir: testInfo.outputPath('build') });
    expectCardInvalid(build, catalogWithInvalidCard.card);
  },
);
