import { expect, type Locator, type Page } from '@playwright/test';
import { RawPage } from './raw-page.ts';

/** HomePage, route /: for now just a link to the repository (SITE-1#6; the Home read model). */
export class HomePage extends RawPage {
  private readonly links: Locator;

  constructor(page: Page, site: string) {
    super(page, site);
    this.links = page.getByRole('link');
  }

  /** Opens the home page; returns the HTTP status. */
  async open(): Promise<number> {
    return this.visit('/');
  }

  /** Home.repository: a link whose target is exactly this URL. */
  async expectRepositoryLink(url: string) {
    const targets = await this.links.evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
    expect.soft(targets, `${this.page.url()}: Home.repository, a link to ${url}`).toContain(url);
  }
}
