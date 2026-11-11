/**
 * T03 Deploy the site (translation; external: Cloudflare). Requirements SITE-1#4, SITE-1#5, SITE-1#6, SITE-1#7,
 * SITE-1#8.
 * Examples: superloops/specs/model/site.em.yaml, slice T03; values quoted from the contract (event-model/1).
 *
 * SITE-1#4 (the site is on superloops.dev) shows only with SITE_BASE_URL=https://superloops.dev: without it the
 * same checks run on the local build, served the way Cloudflare serves it.
 */
import { expect, test } from '../support/fixtures.ts';
import { REPOSITORY_URL, shortHead } from '../support/repo.ts';

const TAGS = ['@T03', '@SITE-1#4', '@SITE-1#5', '@SITE-1#6', '@SITE-1#7', '@SITE-1#8'];

/** Page.language on every screen, as the example states it. */
const LANGUAGE = 'en';

test(
  "a deploy puts the commit's site on superloops.dev",
  { tag: TAGS },
  async ({ siteBuilt, cloudflareDeploys: _cloudflareDeploys, homePage, loopTypePage, superLoopPage, versionFile }) => {
    await test.step('VersionFile: SiteVersion.version is the short hash of the deployed commit', async () => {
      expect.soft(await versionFile.open(), '/version.txt is served').toBe(200);
      await versionFile.expectVersion(shortHead());
    });

    await test.step('HomePage: Home.repository; Page.analytics, Page.stylesheets, Page.language', async () => {
      expect.soft(await homePage.open(), '/ is served').toBe(200);
      await homePage.expectRepositoryLink(REPOSITORY_URL);
      await homePage.expectAnalyticsBeacon();
      await homePage.expectNoBanner();
      await homePage.expectNoStyles();
      await homePage.expectLanguage(LANGUAGE);
    });

    // Every page of the LoopTypePage screen.
    for (const card of siteBuilt.loopTypes) {
      await test.step(`LoopTypePage /loops/${card.id}/: Page.analytics, Page.stylesheets, Page.language`, async () => {
        expect.soft(await loopTypePage.open(card.id), `/loops/${card.id}/ is served`).toBe(200);
        await loopTypePage.expectAnalyticsBeacon();
        await loopTypePage.expectNoBanner();
        await loopTypePage.expectNoStyles();
        await loopTypePage.expectLanguage(LANGUAGE);
      });
    }

    // Every page of the SuperLoopPage screen.
    for (const card of siteBuilt.superLoops) {
      await test.step(`SuperLoopPage /super-loops/${card.id}/: Page.analytics, Page.stylesheets, Page.language`, async () => {
        expect.soft(await superLoopPage.open(card.id), `/super-loops/${card.id}/ is served`).toBe(200);
        await superLoopPage.expectAnalyticsBeacon();
        await superLoopPage.expectNoBanner();
        await superLoopPage.expectNoStyles();
        await superLoopPage.expectLanguage(LANGUAGE);
      });
    }
  },
);

test.fixme(
  'a failed deploy leaves the previous site on superloops.dev',
  {
    tag: TAGS,
    annotation: {
      type: 'fixme',
      description:
        'Cloudflare: fails cannot be forced from a test. Locally there is no Cloudflare to refuse a deploy; on ' +
        'superloops.dev it would take a real deploy made to fail, done by the tests against production. The ' +
        'cloudflareFails fixture is a stub that throws (support/fixtures.ts says what would unblock it).',
    },
  },
  async ({ siteLive, cloudflareFails, versionFile }) => {
    // The deploy of the new build is refused: error DeployFailed.
    expect(cloudflareFails.error).toBe('DeployFailed');
    // superloops.dev still serves the previous site: the version it served before the deploy.
    expect.soft(await versionFile.open(), '/version.txt is served').toBe(200);
    await versionFile.expectVersion(siteLive.version);
  },
);
