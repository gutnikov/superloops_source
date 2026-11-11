import { defineConfig, devices } from '@playwright/test';

/**
 * Acceptance tests of superloops.dev (specs SITE-1, SITE-2). The seams with site/ are in README.md.
 *
 *   npm test                                         the acceptance tests, against a local build of site/
 *   SITE_BASE_URL=https://superloops.dev npm test    the same tests, the pages opened on the deployed site
 *   npm run test:fixtures                            the contract specs of the fixtures
 */
export default defineConfig({
  testDir: '.',
  // One worker: every build runs `npm run build` in the same site/ folder, and Astro keeps a cache there.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: true,
  // The page tests open every page of the site: 96 loops, the super-loops, the home page.
  timeout: 5 * 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    // The fields of a card page carry data-field="<the read model's field>" (README.md, seam 7).
    testIdAttribute: 'data-field',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'acceptance', testMatch: 'specs/**/*.spec.ts' },
    { name: 'fixture-contracts', testMatch: '_fixtures/**/*.contract.spec.ts' },
  ],
});
