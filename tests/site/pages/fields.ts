import { expect, type Locator } from '@playwright/test';
import { collapse, withoutWhitespace, type Section, type CardText } from '../support/catalog.ts';

/**
 * Reading the fields of a card page (seam 7 of tests/site/README.md): each field is an element with
 * data-field="<field>", whose text is the value; the card's sections are inside data-field="sections", each one
 * an <h2> with its name followed by its text. Shared by the loop and the super-loop pages.
 */

/** The texts of the elements a field locator finds, whitespace collapsed. Does not wait: the pages are static. */
export async function readField(field: Locator): Promise<string[]> {
  return (await field.allTextContents()).map(collapse);
}

/** The sections inside the one data-field="sections" element; null when there is not exactly one. */
export async function readSections(container: Locator): Promise<Section[] | null> {
  return container.evaluateAll((containers) => {
    if (containers.length !== 1) return null;
    const out: { name: string; text: string }[] = [];
    let current: { name: string; text: string } | undefined;
    const skip = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT']);
    // Document order over elements and text: an <h2> starts a section, whether the sections are flat or wrapped.
    const walker = document.createTreeWalker(containers[0], NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node instanceof Element && skip.has(node.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node instanceof Element && node.tagName === 'H2') {
        current = { name: node.textContent ?? '', text: '' };
        out.push(current);
      } else if (node.nodeType === Node.TEXT_NODE && current && !node.parentElement?.closest('h2')) {
        current.text += (node as Text).data;
      }
    }
    return out;
  });
}

/** A one-line value: shown once, either as the card writes it or as its Markdown renders. */
export async function expectText(field: Locator, value: CardText, label: string) {
  const accepted = [...new Set([collapse(value.source), value.rendered])].map((text) => [text]);
  expect.soft(accepted, `${label}: shown once, as the card holds it`).toContainEqual(await readField(field));
}

/**
 * A value as a loop page shows it (seam 7): shown once with exactly this text, or, when `shown` is undefined (a field
 * the card does not have), not on the page at all.
 */
export async function expectShown(field: Locator, shown: string | undefined, label: string) {
  if (shown === undefined) expect.soft(await field.count(), `${label}: the card does not have it, so it is not shown`).toBe(0);
  else expect.soft(await readField(field), label).toEqual([shown]);
}

/**
 * The text of a loop card's list on its page (seam 7): the values in the card's order joined with ", "; `none` for a
 * list the card has but empty (`needs: []`); undefined for a list the card does not have.
 */
export function listText(values: string[] | undefined): string | undefined {
  if (values === undefined) return undefined;
  return values.length ? values.join(', ') : 'none';
}

/**
 * A super-loop's list value: shown once, the values in the card's order joined with ", "; not shown when the card has
 * none.
 */
export async function expectList(field: Locator, values: string[], label: string) {
  const shown = await readField(field);
  if (values.length) expect.soft(shown, label).toEqual([values.join(', ')]);
  else expect.soft(shown.filter((text) => text !== ''), `${label}: the card has none`).toEqual([]);
}

/** The card's sections: the same names in the same order, and under each the card's text. */
export async function expectSections(container: Locator, sections: Section[], label: string) {
  const shown = await readSections(container);
  expect.soft(shown?.map((section) => collapse(section.name)), `${label}: the card's sections, in order`).toEqual(
    sections.map((section) => section.name),
  );
  for (const section of sections) {
    const text = shown?.find((s) => collapse(s.name) === section.name)?.text ?? '';
    expect
      .soft(withoutWhitespace(text), `${label}: the card's text under "${section.name}" (compared without whitespace)`)
      .toBe(withoutWhitespace(section.text));
  }
}

/** The section names as an example lists them. */
export async function expectSectionNames(container: Locator, names: string[], label: string) {
  const shown = await readSections(container);
  expect.soft(shown?.map((section) => collapse(section.name)), `${label}: sections`).toEqual(names);
}
