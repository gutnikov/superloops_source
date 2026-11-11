import { expect, type Locator, type Page } from '@playwright/test';

/** VersionFile, route /version.txt: the SiteVersion read model, a plain-text file with one line. */
export class VersionFile {
  // A text/plain response is rendered by the browser as a body with a <pre>: the body's text is the file.
  private readonly content: Locator;

  /** `site` is the origin of the site under test: the local build's server, or SITE_BASE_URL. */
  constructor(
    private readonly page: Page,
    private readonly site: string,
  ) {
    this.content = page.locator('body');
  }

  /** Opens /version.txt; returns the HTTP status. */
  async open(): Promise<number> {
    const response = await this.page.goto(`${this.site}/version.txt`);
    return response?.status() ?? 0;
  }

  /** SiteVersion.version: the file holds this version and nothing else (surrounding whitespace aside). */
  async expectVersion(version: string) {
    await expect(this.content, `${this.page.url()}: SiteVersion.version`).toHaveText(version);
  }
}
