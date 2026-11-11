/**
 * Reads a catalog folder laid out like plugin/parts/harness (loops/, super-loops/) into what each card holds: the
 * expected values of the loop and super-loop pages. Nothing here is invented: every value is read from the cards.
 * A loop's card is loops/<id>/card.md (its frontmatter: loops/loop.schema.json and loops/FORMAT.md); a folder whose
 * name starts with _ is the template, not a loop.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import { parse as parseYaml } from 'yaml';

export type Section = {
  /** The text of the card's `## ` heading. */
  name: string;
  /** The card's text under that heading, as a reader sees it once the Markdown is rendered. */
  text: string;
};

/** One entry of a loop card's `links`: where to read more. Only the title is required. */
export type Link = { title: string; url?: string; author?: string; note?: string };

/**
 * A loop card, field by field, as its frontmatter holds them (the LoopType read model). A field the card does not
 * have is undefined; a list the card has but empty, such as `needs: []`, is [].
 */
export type LoopTypeCard = {
  id: string;
  /** The card's path relative to the catalog folder, e.g. loops/red-green-tdd/card.md. */
  path: string;
  /** The frontmatter's title, as written there and as rendered (they differ when it holds Markdown). */
  title: CardText;
  summary: CardText;
  /** The image's file name, in the card's folder: `image: image.svg`. Optional. */
  image?: string;
  sensor: string;
  ilities: string[];
  places: string[];
  stages: string[];
  /** One value, or a range [from, to]. */
  speed: string[];
  needs: string[];
  agent?: string[];
  related?: string[];
  links: Link[];
  /** The four axes of a loop whose sensor is human; each one optional. */
  when?: string[];
  initiator?: string;
  sync?: string;
  assesses?: string[];
  sections: Section[];
};

export type SuperLoopCard = {
  id: string;
  path: string;
  title: CardText;
  phases: string[];
  exits: string[];
  sections: Section[];
};

/** A one-line value from the catalog: its Markdown source, and the text it renders to. */
export type CardText = { source: string; rendered: string };

export type Catalog = {
  dir: string;
  /** The cards loops/<id>/card.md, by id. */
  loopTypes: LoopTypeCard[];
  /** The files of super-loops/ with frontmatter. README.md and harness-level.md have none: they are documents. */
  superLoops: SuperLoopCard[];
};

type Node = { type: string; value?: string; depth?: number; children?: Node[] };

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

export function readCatalog(dir: string): Catalog {
  const loopsDir = path.join(dir, 'loops');
  const loopTypes: LoopTypeCard[] = [];
  const folders = fs
    .readdirSync(loopsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
  for (const folder of folders) {
    const rel = path.posix.join('loops', folder, 'card.md');
    if (!fs.existsSync(path.join(dir, rel))) continue;
    const { data, body } = readCard(path.join(dir, rel));
    loopTypes.push({
      id: String(data.id),
      path: rel,
      title: text(String(data.title)),
      summary: text(String(data.summary)),
      image: optionalValue(data.image),
      sensor: String(data.sensor),
      ilities: list(data.ilities),
      places: list(data.places),
      stages: list(data.stages),
      speed: list(data.speed),
      needs: list(data.needs),
      agent: optionalList(data.agent),
      related: optionalList(data.related),
      links: links(data.links),
      when: optionalList(data.when),
      initiator: optionalValue(data.initiator),
      sync: optionalValue(data.sync),
      assesses: optionalList(data.assesses),
      sections: sections(body),
    });
  }

  const superLoopsDir = path.join(dir, 'super-loops');
  const superLoops: SuperLoopCard[] = [];
  for (const file of fs.readdirSync(superLoopsDir).sort()) {
    if (!file.endsWith('.md')) continue;
    const rel = path.posix.join('super-loops', file);
    const card = readCard(path.join(dir, rel));
    if (!card.hasFrontmatter) continue;
    superLoops.push({
      id: String(card.data.id),
      path: rel,
      title: text(String(card.data.title)),
      phases: list(card.data.phases),
      exits: list(card.data.exits),
      sections: sections(card.body),
    });
  }

  return { dir, loopTypes, superLoops };
}

function readCard(file: string): { hasFrontmatter: boolean; data: Record<string, unknown>; body: string } {
  const source = fs.readFileSync(file, 'utf8');
  const match = FRONTMATTER.exec(source);
  if (!match) return { hasFrontmatter: false, data: {}, body: source };
  return { hasFrontmatter: true, data: parseYaml(match[1]) ?? {}, body: source.slice(match[0].length) };
}

function list(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

/** A list field the card may leave out: undefined when it does. */
function optionalList(value: unknown): string[] | undefined {
  return value === undefined || value === null ? undefined : list(value);
}

/** A one-value field the card may leave out: undefined when it does. */
function optionalValue(value: unknown): string | undefined {
  return value === undefined || value === null ? undefined : String(value);
}

function links(value: unknown): Link[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry: Record<string, unknown>) => {
    const link: Link = { title: String(entry.title) };
    for (const key of ['url', 'author', 'note'] as const) {
      if (entry[key] !== undefined && entry[key] !== null) link[key] = String(entry[key]);
    }
    return link;
  });
}

function markdown(source: string): Node {
  return fromMarkdown(source, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }) as Node;
}

function text(source: string): CardText {
  return { source, rendered: collapse(toText(markdown(source))) };
}

/**
 * The card's `## ` sections, in order, each with the text up to the next one. An H1 (a super-loop card's title; a
 * loop card has none) is not one.
 */
function sections(body: string): Section[] {
  const out: Section[] = [];
  let current: Section | undefined;
  for (const node of markdown(body).children ?? []) {
    if (node.type === 'heading' && node.depth === 2) {
      current = { name: collapse(toText(node)), text: '' };
      out.push(current);
    } else if (node.type === 'heading' && node.depth === 1) {
      current = undefined;
    } else if (current) {
      current.text += toText(node) + '\n';
    }
  }
  return out;
}

/** The text a browser shows for the node: what textContent gives once it is rendered to HTML. */
function toText(node: Node): string {
  // Raw HTML, images and link definitions render to no text of their own (and the cards have none today).
  if (node.type === 'html' || node.type === 'image' || node.type === 'imageReference' || node.type === 'definition') {
    return '';
  }
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(toText).join('');
}

export function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** For the text of a section: renderers differ only in the whitespace they put between blocks. */
export function withoutWhitespace(value: string): string {
  return value.replace(/\s+/g, '');
}
