/**
 * What the site is configured with, in one place. These are the committed values: none of them comes from the
 * environment, so every build of a commit carries the same ones.
 */
export const config = {
  /** The repository: the home page's one link (SITE-1#6), and where a card's link to a file with no page goes. */
  repository: 'https://github.com/gutnikov/superloops',
  /** The branch whose files those links open. */
  branch: 'main',
  /**
   * The Cloudflare Web Analytics token of superloops.dev (SITE-1#5), from the site's entry in the Cloudflare
   * dashboard. The build fails while it is empty.
   */
  analyticsToken: 'a3efcdc85268432aae5594b62ef77d8f',
};

/**
 * Cloudflare Web Analytics' snippet for every page, exactly as the dashboard gives it, with the token above. The
 * site is not also set up for injection at the edge, which would count every view twice. Throws while the token is
 * empty or does not look like one, so the build stops instead of publishing pages that count nothing.
 */
export function analyticsSnippet() {
  const token = config.analyticsToken;
  if (!token) {
    throw new Error(
      'AnalyticsTokenMissing: site/src/config.mjs has no analyticsToken. Set it to the Cloudflare Web Analytics ' +
        'token of superloops.dev (Cloudflare dashboard > Web Analytics > superloops.dev > Manage site).',
    );
  }
  if (!/^[0-9a-f]{32}$/.test(token)) {
    throw new Error(
      `AnalyticsTokenInvalid: the analyticsToken in site/src/config.mjs is ${JSON.stringify(token)}; ` +
        'a Cloudflare Web Analytics token is 32 lowercase hex characters.',
    );
  }
  return (
    '<!-- Cloudflare Web Analytics -->' +
    `<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "${token}"}'></script>` +
    '<!-- End Cloudflare Web Analytics -->'
  );
}
