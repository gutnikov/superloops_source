/**
 * T01 Publish the loop types (translation; external: Catalog). Requirements SITE-1#1, SITE-1#2, SITE-2#1, SITE-2#2,
 * SITE-2#3, SITE-2#4.
 * Examples: superloops/specs/model/site.em.yaml, slice T01; values quoted from the contract (event-model/1).
 * How each field of the LoopType read model is shown on the page: tests/site/README.md, seam 7.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildSite, expectCardInvalid } from '../support/build.ts';
import { expect, test } from '../support/fixtures.ts';
import type { LoopImage, LoopTypeText } from '../pages/loop-type-page.ts';

const TAGS = ['@T01', '@SITE-1#1', '@SITE-1#2', '@SITE-2#1', '@SITE-2#2', '@SITE-2#3', '@SITE-2#4'];

/** The see of "every card of the catalog has a page with what the card holds", as the contract states it. */
const EVERY_CARD = {
  fields: {
    title: 'Unit tests, red/green TDD',
    summary: 'The agent writes a test and sees it fail, then writes the code until the test passes, then refactors.',
    sensor: 'computational',
    ilities: 'testability, correctness',
    places: 'delivery/work, remediation/work',
    stages: 'local',
    speed: 'seconds',
    needs: 'none',
    agent: 'reviewer',
  } satisfies LoopTypeText,
  // "acceptance-loop, mutation-testing: each a link to that loop's page"
  related: ['acceptance-loop', 'mutation-testing'],
  // "5 links, in the card's order; the first: Red/green TDD — Agentic Engineering Patterns, by Simon Willison, to
  // https://andrewmurphy.io/stdlib/b139fcdd-2733-435b-a97f-6d7e47836719"
  links: {
    count: 5,
    first: {
      title: 'Red/green TDD — Agentic Engineering Patterns',
      author: 'Simon Willison',
      url: 'https://andrewmurphy.io/stdlib/b139fcdd-2733-435b-a97f-6d7e47836719',
    },
  },
  // image: "none: the card has no image", checked by expectNoImage.
  // "Why, How it works, Set up, Notes, Agent step, with the card's text": the text is checked by expectCard.
  sectionNames: ['Why', 'How it works', 'Set up', 'Notes', 'Agent step'],
};

/** The see of "a loop where a person gives the signal shows its four axes", as the contract states it. */
const HUMAN_AXES = {
  title: 'Plan approval',
  sensor: 'human',
  when: 'before',
  initiator: 'agent',
  sync: 'blocking',
  assesses: 'plan',
} satisfies LoopTypeText;

/**
 * The see of "a card's image illustrates its page": "the card's image, right under the title, its alt text the
 * loop's name: Unit tests, red/green TDD", and "the bytes of loops/red-green-tdd/image.svg, at
 * /loops/red-green-tdd/image.svg".
 */
const IMAGE: LoopImage = { id: 'red-green-tdd', file: 'image.svg', alt: 'Unit tests, red/green TDD' };

test(
  'every card of the catalog has a page with what the card holds',
  { tag: TAGS },
  async ({ catalogOnMain, catalogValid: _catalogValid, loopTypePage }) => {
    const exampleCard = catalogOnMain.loopTypes.find((card) => card.title.source === EVERY_CARD.fields.title);
    expect(exampleCard, `a card titled "${EVERY_CARD.fields.title}" is in the catalog`).toBeDefined();

    await test.step(`the example's card: ${exampleCard!.path}`, async () => {
      expect.soft(await loopTypePage.open(exampleCard!.id), `/loops/${exampleCard!.id}/ is served`).toBe(200);
      await loopTypePage.expectFields(EVERY_CARD.fields);
      await loopTypePage.expectRelated(EVERY_CARD.related);
      await loopTypePage.expectLinks(EVERY_CARD.links);
      await loopTypePage.expectNoImage();
      await loopTypePage.expectSectionNames(EVERY_CARD.sectionNames);
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
  'a loop where a person gives the signal shows its four axes',
  { tag: TAGS },
  async ({ catalogOnMain, catalogValid: _catalogValid, loopTypePage }) => {
    const exampleCard = catalogOnMain.loopTypes.find((card) => card.title.source === HUMAN_AXES.title);
    expect(exampleCard, `a card titled "${HUMAN_AXES.title}" is in the catalog`).toBeDefined();

    expect.soft(await loopTypePage.open(exampleCard!.id), `/loops/${exampleCard!.id}/ is served`).toBe(200);
    await loopTypePage.expectFields(HUMAN_AXES);
  },
);

test.describe(() => {
  // The pages of this example are those of the site built from catalogWithImage, served locally, also when
  // SITE_BASE_URL is set: superloops.dev is built from the repository's catalog, where no card has an image.
  test.use({ siteUnderTest: async ({ siteWithImage }, use) => use(siteWithImage.url) });

  test("a card's image illustrates its page", { tag: TAGS }, async ({ catalogWithImage, loopTypePage }) => {
    await test.step(`LoopTypePage /loops/${IMAGE.id}/: LoopType.image`, async () => {
      expect.soft(await loopTypePage.open(IMAGE.id), `/loops/${IMAGE.id}/ is served`).toBe(200);
      await loopTypePage.expectImage(IMAGE);
    });

    await test.step(`LoopImageFile /loops/${IMAGE.id}/${IMAGE.file}: LoopType.image`, async () => {
      const bytes = fs.readFileSync(path.join(catalogWithImage.dir, catalogWithImage.image));
      await loopTypePage.expectImageFile(IMAGE.id, IMAGE.file, bytes);
    });
  });
});

test(
  'a card the site cannot show stops the build',
  { tag: TAGS },
  async ({ siteLive: _siteLive, catalogWithInvalidCard }, testInfo) => {
    const build = await buildSite({ catalog: catalogWithInvalidCard.dir, outDir: testInfo.outputPath('build') });
    expectCardInvalid(build, catalogWithInvalidCard.card);
  },
);
