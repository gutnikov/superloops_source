import { expect, type Locator, type Page } from '@playwright/test';
import type { LoopTypeCard } from '../support/catalog.ts';
import { expectList, expectSectionNames, expectSections, expectText, readField } from './fields.ts';
import { RawPage } from './raw-page.ts';

/** The values of the LoopType read model as an example of the spec writes them. */
export type LoopTypeExample = {
  title: string;
  group: string;
  places: string;
  stages: string;
  qualities: string;
  summary: string;
  sectionNames: string[];
};

/** LoopTypePage, route /loops/<id>/: one loop type of the catalog (the LoopType read model). */
export class LoopTypePage extends RawPage {
  // Fields carry data-field (the testIdAttribute in playwright.config.ts): raw pages have no other stable handle.
  private readonly field: (name: string) => Locator;
  private readonly sections: Locator;

  constructor(page: Page, site: string) {
    super(page, site);
    this.field = (name) => page.getByTestId(name);
    this.sections = page.getByTestId('sections');
  }

  /** Opens the page of the loop type with this id; returns the HTTP status. */
  async open(id: string): Promise<number> {
    return this.visit(`/loops/${id}/`);
  }

  /** The values the example states, compared as written. */
  async expectExample(example: LoopTypeExample) {
    const where = this.page.url();
    for (const name of ['title', 'group', 'places', 'stages', 'qualities', 'summary'] as const) {
      expect.soft(await readField(this.field(name)), `${where}: LoopType.${name}`).toEqual([example[name]]);
    }
    await expectSectionNames(this.sections, example.sectionNames, `${where}: LoopType.sections`);
  }

  /** What the card holds, field by field. */
  async expectCard(card: LoopTypeCard) {
    const where = `${this.page.url()} (${card.path})`;
    await expectText(this.field('title'), card.title, `${where}: LoopType.title`);
    expect.soft(await readField(this.field('group')), `${where}: LoopType.group`).toEqual([card.group]);
    await expectList(this.field('places'), card.places, `${where}: LoopType.places`);
    await expectList(this.field('stages'), card.stages, `${where}: LoopType.stages`);
    await expectList(this.field('qualities'), card.qualities, `${where}: LoopType.qualities`);
    await expectText(this.field('summary'), card.summary, `${where}: LoopType.summary`);
    await expectSections(this.sections, card.sections, `${where}: LoopType.sections`);
  }
}
