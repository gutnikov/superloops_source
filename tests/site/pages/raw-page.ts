import { expect, type Locator, type Page } from '@playwright/test';
import { BEACON_SRC } from '../support/repo.ts';

/**
 * What every page of the site has: the Page read model (analytics, stylesheets, language), on the home page, the loop-type
 * pages and the super-loop pages. The pages are static: everything is in the DOM once `goto` resolves, so the
 * checks read it once and do not wait.
 */
export class RawPage {
  // Cloudflare Web Analytics' manual snippet is <script defer src="…/beacon.min.js" data-cf-beacon='{"token":…}'>;
  // the automatic setup appends a version to the path, so the match is on the start of src.
  private readonly beacons: Locator;
  private readonly linkedStylesheets: Locator;
  private readonly styleElements: Locator;
  private readonly styleAttributes: Locator;
  // A consent banner is a dialog or a bar with buttons; the raw pages have neither.
  private readonly dialogs: Locator;
  private readonly buttons: Locator;
  private readonly body: Locator;
  // The document's language is the lang attribute of <html>.
  private readonly root: Locator;

  /** `site` is the origin of the site under test: the local build's server, or SITE_BASE_URL. */
  constructor(
    protected readonly page: Page,
    protected readonly site: string,
  ) {
    this.beacons = page.locator(`script[src^="${BEACON_SRC}"]`);
    this.linkedStylesheets = page.locator('link[rel~="stylesheet" i]');
    this.styleElements = page.locator('style');
    this.styleAttributes = page.locator('[style]');
    this.dialogs = page.getByRole('dialog').or(page.getByRole('alertdialog'));
    this.buttons = page.getByRole('button');
    this.body = page.locator('body');
    this.root = page.locator('html');
  }

  /** Opens a path of the site under test; returns the HTTP status. */
  protected async visit(path: string): Promise<number> {
    const response = await this.page.goto(this.site + path);
    return response?.status() ?? 0;
  }

  /** Page.analytics, first half: the Cloudflare Web Analytics beacon, once, with a token. */
  async expectAnalyticsBeacon() {
    const where = this.page.url();
    const configs = await this.beacons.evaluateAll((scripts) => scripts.map((s) => s.getAttribute('data-cf-beacon')));
    expect.soft(configs.length, `${where}: one Cloudflare Web Analytics beacon (${BEACON_SRC})`).toBe(1);
    if (configs.length === 1) {
      expect.soft(tokenOf(configs[0]), `${where}: the beacon's data-cf-beacon carries a token`).not.toBe('');
    }
  }

  /** Page.analytics, second half: no banner, so nothing that asks the visitor about cookies or consent. */
  async expectNoBanner() {
    const where = this.page.url();
    expect.soft(await this.dialogs.count(), `${where}: no dialog`).toBe(0);
    expect.soft(await this.buttons.count(), `${where}: no button`).toBe(0);
    // The card's own text is left out (the data-field elements, seam 7): a card may one day be about cookies.
    const pageText = await this.body.evaluate((body) => {
      const copy = body.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('[data-field], script, style, noscript, template').forEach((element) => element.remove());
      return copy.textContent ?? '';
    });
    expect.soft(pageText, `${where}: no word about cookies or consent`).not.toMatch(/cookie|consent/i);
  }

  /** Page.language: the page says it is in this language, as <html lang="…">, exactly. */
  async expectLanguage(language: string) {
    expect.soft(await this.root.getAttribute('lang'), `${this.page.url()}: Page.language, <html lang>`).toBe(language);
  }

  /** Page.stylesheets: "none: no linked stylesheet, no style element, no style attribute". */
  async expectNoStyles() {
    const where = this.page.url();
    expect.soft(await this.linkedStylesheets.count(), `${where}: no linked stylesheet`).toBe(0);
    expect.soft(await this.styleElements.count(), `${where}: no style element`).toBe(0);
    expect.soft(await this.styleAttributes.count(), `${where}: no style attribute`).toBe(0);
  }
}

function tokenOf(config: string | null): string {
  try {
    const token = JSON.parse(config ?? '').token;
    return typeof token === 'string' ? token : '';
  } catch {
    return '';
  }
}
