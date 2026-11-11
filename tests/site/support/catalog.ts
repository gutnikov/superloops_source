/**
 * Reads a catalog folder laid out like plugin/parts/harness (loop-types/, super-loops/) into what each card holds:
 * the expected values of the loop-type and super-loop pages. Nothing here is invented: every value is read from
 * the cards, except the summary, which the catalog itself states in loop-types/index.yaml (scripts/catalog.py
 * derives it from the card's Loop section).
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

export type LoopTypeCard = {
  id: string;
  /** The card's path relative to the catalog folder, e.g. loop-types/testing/red-green-tdd.md. */
  path: string;
  /** The frontmatter's title, as written there and as rendered (they differ when it holds Markdown). */
  title: CardText;
  group: string;
  places: string[];
  stages: string[];
  qualities: string[];
  summary: CardText;
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
  /** The group folders of loop-types/. */
  groups: string[];
  loopTypes: LoopTypeCard[];
  /** The files of super-loops/ with frontmatter. README.md and harness-level.md have none: they are documents. */
  superLoops: SuperLoopCard[];
};

type Node = { type: string; value?: string; depth?: number; children?: Node[] };

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

export function readCatalog(dir: string): Catalog {
  const loopTypesDir = path.join(dir, 'loop-types');
  const groups = fs
    .readdirSync(loopTypesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const summaries = readSummaries(path.join(loopTypesDir, 'index.yaml'));

  const loopTypes: LoopTypeCard[] = [];
  for (const group of groups) {
    for (const file of fs.readdirSync(path.join(loopTypesDir, group)).sort()) {
      if (!file.endsWith('.md') || file === 'README.md') continue;
      const rel = path.posix.join('loop-types', group, file);
      const { data, body } = readCard(path.join(dir, rel));
      const id = String(data.id);
      loopTypes.push({
        id,
        path: rel,
        title: text(String(data.title)),
        group: String(data.group),
        places: list(data.places),
        stages: list(data.stages),
        qualities: list(data.qualities),
        summary: text(summaries.get(id) ?? ''),
        sections: sections(body),
      });
    }
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

  return { dir, groups, loopTypes, superLoops };
}

function readCard(file: string): { hasFrontmatter: boolean; data: Record<string, unknown>; body: string } {
  const source = fs.readFileSync(file, 'utf8');
  const match = FRONTMATTER.exec(source);
  if (!match) return { hasFrontmatter: false, data: {}, body: source };
  return { hasFrontmatter: true, data: parseYaml(match[1]) ?? {}, body: source.slice(match[0].length) };
}

function readSummaries(indexFile: string): Map<string, string> {
  const index = parseYaml(fs.readFileSync(indexFile, 'utf8')) as { loop_types: { id: string; summary: string }[] };
  return new Map(index.loop_types.map((entry) => [entry.id, entry.summary]));
}

function list(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function markdown(source: string): Node {
  return fromMarkdown(source, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }) as Node;
}

function text(source: string): CardText {
  return { source, rendered: collapse(toText(markdown(source))) };
}

/** The card's `## ` sections, in order, each with the text up to the next one. The H1 (the title) is not one. */
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
