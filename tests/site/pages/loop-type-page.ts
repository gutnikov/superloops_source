import { expect, type Locator, type Page } from '@playwright/test';
import type { Link, LoopTypeCard } from '../support/catalog.ts';
import { expectSectionNames, expectSections, expectShown, expectText, listText, readField } from './fields.ts';
import { RawPage } from './raw-page.ts';

/** The fields of the LoopType read model (slice V01), each one a data-field of the page (README.md, seam 7). */
export const LOOP_TYPE_FIELDS = [
  'title',
  'summary',
  'image',
  'sensor',
  'ilities',
  'places',
  'stages',
  'speed',
  'needs',
  'agent',
  'related',
  'links',
  'when',
  'initiator',
  'sync',
  'assesses',
  'sections',
] as const;

export type LoopTypeField = (typeof LOOP_TYPE_FIELDS)[number];

/** Fields whose value is the element's text, as an example of the spec writes it: `ilities: 'testability, correctness'`. */
export type LoopTypeText = Partial<Record<Exclude<LoopTypeField, 'image' | 'links' | 'sections'>, string>>;

/** LoopType.image as an example states it: the image of the loop `id`, the file `file` of its folder, with this alt. */
export type LoopImage = { id: string; file: string; alt: string };

/**
 * The text of one entry of LoopType.links (seam 7): the title, then ", by <author>" and " — <note>" where the entry
 * has them. Where it has a url, the title is the text of a link to it.
 */
export function linkEntryText(link: Link): string {
  return link.title + (link.author ? `, by ${link.author}` : '') + (link.note ? ` — ${link.note}` : '');
}

/** One <li> of the links field: its text, and the links in it. */
type ShownLink = { text: string; anchors: { text: string; href: string | null }[] };

/** An element with data-field="image": what it is, where it is, and whether the browser shows the picture. */
type ShownImage = { tag: string; underTitle: boolean; alt: string | null; src: string; loaded: boolean };

/**
 * LoopTypePage, route /loops/<id>/: one loop of the catalog (the LoopType read model). Also LoopImageFile, route
 * /loops/<id>/<image>: the card's image, served next to its page.
 */
export class LoopTypePage extends RawPage {
  // Fields carry data-field (the testIdAttribute in playwright.config.ts): raw pages have no other stable handle.
  private readonly field: (name: LoopTypeField) => Locator;
  // Every element that says it is a field: the page shows the card's fields and no others.
  private readonly fields: Locator;
  private readonly sections: Locator;
  private readonly images: Locator;
  // The entries of LoopType.links are the <li> inside its element, whether that element is the list or holds it.
  private readonly linkEntries: Locator;
  private readonly relatedLinks: Locator;

  constructor(page: Page, site: string) {
    super(page, site);
    this.field = (name) => page.getByTestId(name);
    this.fields = page.locator('[data-field]');
    this.sections = page.getByTestId('sections');
    this.images = page.locator('img');
    this.linkEntries = page.getByTestId('links').locator('li');
    this.relatedLinks = page.getByTestId('related').locator('a');
  }

  /** Opens the page of the loop with this id; returns the HTTP status. */
  async open(id: string): Promise<number> {
    return this.visit(`/loops/${id}/`);
  }

  /** Fields shown as text: each one shown once, with exactly the text the example states. */
  async expectFields(values: LoopTypeText) {
    const where = this.page.url();
    for (const [name, value] of Object.entries(values)) {
      expect.soft(await readField(this.field(name as LoopTypeField)), `${where}: LoopType.${name}`).toEqual([value]);
    }
  }

  /** LoopType.related: these ids, joined with ", ", each one a link to that loop's page. */
  async expectRelated(ids: string[]) {
    await this.expectRelatedOf(ids, this.page.url());
  }

  /** LoopType.links: this many entries, in the card's order, the first one this link. */
  async expectLinks(example: { count: number; first: Link }) {
    const where = this.page.url();
    const shown = await this.readLinks();
    expect.soft(shown.length, `${where}: LoopType.links, the number of entries`).toBe(example.count);
    expect.soft(shown[0], `${where}: LoopType.links, the first entry`).toEqual(entryOf(example.first));
  }

  /** LoopType.image, "none: the card has no image". */
  async expectNoImage() {
    await this.expectNoImageOn(this.page.url());
  }

  /** LoopType.image: the card's image, right under the title, with this alt text, its file next to the page. */
  async expectImage(image: LoopImage) {
    expect
      .soft(await this.readImage(), `${this.page.url()}: LoopType.image`)
      .toEqual([this.imageOf(image.id, image.file, image.alt)]);
  }

  /** LoopImageFile, /loops/<id>/<file>: answers with exactly these bytes, those of the card's file. */
  async expectImageFile(id: string, file: string, bytes: Buffer) {
    const url = `${this.site}/loops/${id}/${file}`;
    const response = await this.page.request.get(url);
    expect.soft(response.status(), `${url} is served`).toBe(200);
    expect.soft(await response.body(), `${url}: LoopType.image, the bytes of loops/${id}/${file}`).toEqual(bytes);
  }

  /** LoopType.sections: the section names as an example lists them. */
  async expectSectionNames(names: string[]) {
    await expectSectionNames(this.sections, names, `${this.page.url()}: LoopType.sections`);
  }

  /** What the card holds, field by field, and no field it does not hold. */
  async expectCard(card: LoopTypeCard) {
    const where = `${this.page.url()} (${card.path})`;
    await expectText(this.field('title'), card.title, `${where}: LoopType.title`);
    await expectText(this.field('summary'), card.summary, `${where}: LoopType.summary`);
    await expectShown(this.field('sensor'), card.sensor, `${where}: LoopType.sensor`);
    for (const name of ['ilities', 'places', 'stages', 'speed', 'needs', 'agent', 'when', 'assesses'] as const) {
      await expectShown(this.field(name), listText(card[name]), `${where}: LoopType.${name}`);
    }
    for (const name of ['initiator', 'sync'] as const) {
      await expectShown(this.field(name), card[name], `${where}: LoopType.${name}`);
    }
    await this.expectRelatedOf(card.related, where);
    await this.expectLinksOf(card.links, where);
    if (card.image === undefined) {
      await this.expectNoImageOn(where);
    } else {
      // The alt text is the loop's name, as the card writes it or as its Markdown renders, like the title.
      const alt = expect.stringMatching(oneOf([card.title.source, card.title.rendered]));
      expect.soft(await this.readImage(), `${where}: LoopType.image`).toEqual([this.imageOf(card.id, card.image, alt)]);
    }
    await expectSections(this.sections, card.sections, `${where}: LoopType.sections`);
    // "What the card holds" and nothing else: no field the card has not got, such as SITE-1's group (SITE-2#4).
    const names = LOOP_TYPE_FIELDS.filter((name) => card[name] !== undefined);
    expect.soft(await this.readFieldNames(), `${where}: the page's data-field elements, one per field the card has`).toEqual(
      [...names].sort(),
    );
  }

  private async expectRelatedOf(ids: string[] | undefined, where: string) {
    await expectShown(this.field('related'), listText(ids), `${where}: LoopType.related`);
    if (ids === undefined) return;
    const shown = await this.relatedLinks.evaluateAll((links) =>
      links.map((a) => ({ text: (a.textContent ?? '').replace(/\s+/g, ' ').trim(), href: (a as HTMLAnchorElement).href })),
    );
    // Compared where the link leads: /loops/<id>/ on the site under test.
    expect
      .soft(shown, `${where}: LoopType.related, each one a link to that loop's page`)
      .toEqual(ids.map((id) => ({ text: id, href: `${this.site}/loops/${id}/` })));
  }

  private async expectLinksOf(links: LoopTypeCard['links'], where: string) {
    if (links.length) expect.soft(await this.field('links').count(), `${where}: LoopType.links, shown once`).toBe(1);
    else await expectShown(this.field('links'), 'none', `${where}: LoopType.links, the card has none`);
    expect
      .soft(await this.readLinks(), `${where}: LoopType.links, one <li> per entry, in the card's order`)
      .toEqual(links.map(entryOf));
  }

  private async expectNoImageOn(where: string) {
    expect
      .soft(
        { imageFields: await this.field('image').count(), images: await this.images.count() },
        `${where}: LoopType.image, none: the card has no image`,
      )
      .toEqual({ imageFields: 0, images: 0 });
  }

  private async readLinks(): Promise<ShownLink[]> {
    return this.linkEntries.evaluateAll((items) => {
      const text = (element: Element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim();
      return items.map((item) => ({
        text: text(item),
        anchors: Array.from(item.querySelectorAll('a')).map((a) => ({ text: text(a), href: a.getAttribute('href') })),
      }));
    });
  }

  private async readImage(): Promise<ShownImage[]> {
    return this.field('image').evaluateAll((elements) =>
      elements.map((element) => {
        const img = element instanceof HTMLImageElement ? element : undefined;
        return {
          tag: element.tagName.toLowerCase(),
          // "Right under the title": the image is the element that comes next after the title element.
          underTitle: element.previousElementSibling?.getAttribute('data-field') === 'title',
          alt: element.getAttribute('alt'),
          src: img?.src ?? '',
          // The page has loaded (goto waits for its images): the browser has the picture, not a broken image.
          loaded: img !== undefined && img.complete && img.naturalWidth > 0,
        };
      }),
    );
  }

  private async readFieldNames(): Promise<string[]> {
    const names = await this.fields.evaluateAll((elements) => elements.map((e) => e.getAttribute('data-field') ?? ''));
    return names.sort();
  }

  /** What the page shows for an image: an <img> right under the title, its src the file next to the page. */
  private imageOf(id: string, file: string, alt: unknown): ShownImage {
    return { tag: 'img', underTitle: true, alt: alt as string, src: `${this.site}/loops/${id}/${file}`, loaded: true };
  }
}

/** An entry of links as the page shows it (seam 7). */
function entryOf(link: Link): ShownLink {
  return { text: linkEntryText(link), anchors: link.url ? [{ text: link.title, href: link.url }] : [] };
}

/** A pattern that matches exactly one of these texts. */
function oneOf(texts: string[]): RegExp {
  return new RegExp(`^(${[...new Set(texts)].map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`);
}
