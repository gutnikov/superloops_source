import { expect, type Locator, type Page } from '@playwright/test';
import type { SuperLoopCard } from '../support/catalog.ts';
import { expectList, expectSectionNames, expectSections, expectText, readField } from './fields.ts';
import { RawPage } from './raw-page.ts';

/** The values of the SuperLoop read model as an example of the spec writes them. */
export type SuperLoopExample = {
  title: string;
  phases: string;
  exits: string;
  sectionNames: string[];
};

/** SuperLoopPage, route /super-loops/<id>/: one super-loop card (the SuperLoop read model). */
export class SuperLoopPage extends RawPage {
  // Fields carry data-field (the testIdAttribute in playwright.config.ts): raw pages have no other stable handle.
  private readonly field: (name: string) => Locator;
  private readonly sections: Locator;

  constructor(page: Page, site: string) {
    super(page, site);
    this.field = (name) => page.getByTestId(name);
    this.sections = page.getByTestId('sections');
  }

  /** Opens the page of the super-loop with this id; returns the HTTP status. */
  async open(id: string): Promise<number> {
    return this.visit(`/super-loops/${id}/`);
  }

  /** The values the example states, compared as written. */
  async expectExample(example: SuperLoopExample) {
    const where = this.page.url();
    for (const name of ['title', 'phases', 'exits'] as const) {
      expect.soft(await readField(this.field(name)), `${where}: SuperLoop.${name}`).toEqual([example[name]]);
    }
    await expectSectionNames(this.sections, example.sectionNames, `${where}: SuperLoop.sections`);
  }

  /** What the card holds, field by field. */
  async expectCard(card: SuperLoopCard) {
    const where = `${this.page.url()} (${card.path})`;
    await expectText(this.field('title'), card.title, `${where}: SuperLoop.title`);
    await expectList(this.field('phases'), card.phases, `${where}: SuperLoop.phases`);
    await expectList(this.field('exits'), card.exits, `${where}: SuperLoop.exits`);
    await expectSections(this.sections, card.sections, `${where}: SuperLoop.sections`);
  }
}
