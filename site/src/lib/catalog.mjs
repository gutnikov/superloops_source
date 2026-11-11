/**
 * The plugin's catalog, read at build time from a folder laid out like plugin/parts/harness: the loop-type cards
 * (loop-types/<group>/<id>.md, their summaries in loop-types/index.yaml) and the super-loop cards (the files of
 * super-loops/ with frontmatter; README.md and harness-level.md have none: they are documents, with no page).
 *
 * Nothing of a card is copied into the site: every page is built from what this reads. A card the site cannot
 * show stops the build with CardInvalid and the card's path relative to the catalog folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { config } from '../config.mjs';
import { renderBlock, renderInline } from './markdown.mjs';

/** Where the catalog is in the repository: the base of the links to its files on GitHub. */
const CATALOG_IN_REPOSITORY = 'plugin/parts/harness';

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

/** One or more cards of the catalog that the site cannot show. */
export class CardInvalid extends Error {
  /** @param {{ card: string, reason: string }[]} problems  card: the path relative to the catalog folder */
  constructor(problems, dir) {
    super(
      `${problems.length} card(s) of the catalog at ${dir} cannot be shown:\n` +
        problems.map(({ card, reason }) => `  CardInvalid: ${card}: ${reason}`).join('\n'),
    );
    this.name = 'CardInvalid';
    this.problems = problems;
  }
}

/**
 * @typedef {{ html: string, text: string }} Text  a one-line value, rendered and as plain text
 * @typedef {{ id: string, path: string, title: Text, group: string, places: string[], stages: string[],
 *   qualities: string[], summary: string, sections: string }} LoopType  summary and sections are HTML
 * @typedef {{ id: string, path: string, title: Text, phases: string[], exits: string[], sections: string }} SuperLoop
 * @typedef {{ dir: string, loopTypes: LoopType[], superLoops: SuperLoop[] }} Catalog
 */

/**
 * Reads and renders every card of the catalog folder `dir`.
 * @param {string} dir  absolute
 * @returns {Catalog}
 */
export function loadCatalog(dir) {
  const loopTypesDir = path.join(dir, 'loop-types');
  const superLoopsDir = path.join(dir, 'super-loops');
  for (const folder of [loopTypesDir, superLoopsDir]) {
    if (!isFolder(folder)) {
      throw new Error(
        `CatalogUnreadable: ${dir} has no ${path.basename(folder)}/ folder. SUPERLOOPS_CATALOG must be a folder ` +
          'laid out like plugin/parts/harness.',
      );
    }
  }
  const summaries = readSummaries(path.join(loopTypesDir, 'index.yaml'));
  const problems = [];

  // First every card's frontmatter, so that a link from one card to another resolves to that card's page.
  const loopTypeCards = [];
  for (const group of fs.readdirSync(loopTypesDir).filter((name) => isFolder(path.join(loopTypesDir, name))).sort()) {
    for (const file of fs.readdirSync(path.join(loopTypesDir, group)).sort()) {
      if (!file.endsWith('.md') || file === 'README.md') continue;
      const rel = `loop-types/${group}/${file}`;
      const card = readCard(dir, rel);
      if (!card.data) {
        problems.push({ card: rel, reason: card.problem ?? 'no frontmatter' });
        continue;
      }
      const check = checker(rel, problems);
      const id = check.id(card.data.id, file);
      const title = check.text(card.data.title, 'title');
      const cardGroup = check.text(card.data.group, 'group');
      if (cardGroup !== undefined && cardGroup !== group) check.fail(`group ${JSON.stringify(cardGroup)} is not its folder, ${group}`);
      const places = check.list(card.data.places, 'places');
      const stages = check.list(card.data.stages, 'stages');
      const qualities = check.list(card.data.qualities, 'qualities');
      const summary = id === undefined ? undefined : summaries.get(id);
      if (id !== undefined && !summary) {
        check.fail(`loop-types/index.yaml has no summary for ${id} (python3 scripts/catalog.py index writes it)`);
      }
      if (check.ok) loopTypeCards.push({ rel, body: card.body, id, title, group, places, stages, qualities, summary });
    }
  }

  const superLoopCards = [];
  for (const file of fs.readdirSync(superLoopsDir).sort()) {
    if (!file.endsWith('.md')) continue;
    const rel = `super-loops/${file}`;
    const card = readCard(dir, rel);
    if (card.problem) {
      problems.push({ card: rel, reason: card.problem });
      continue;
    }
    if (!card.data) continue; // a document about the super-loops, not a card
    const check = checker(rel, problems);
    const id = check.id(card.data.id, file);
    const title = check.text(card.data.title, 'title');
    const phases = check.list(card.data.phases, 'phases');
    const exits = check.list(card.data.exits, 'exits');
    if (check.ok) superLoopCards.push({ rel, body: card.body, id, title, phases, exits });
  }

  const pages = new Map();
  for (const [cards, route] of [[loopTypeCards, 'loops'], [superLoopCards, 'super-loops']]) {
    const seen = new Map();
    for (const card of cards) {
      if (seen.has(card.id)) {
        problems.push({ card: card.rel, reason: `id ${card.id} is also the id of ${seen.get(card.id)}` });
      }
      seen.set(card.id, card.rel);
      pages.set(`${CATALOG_IN_REPOSITORY}/${card.rel}`, `/${route}/${card.id}/`);
    }
  }
  if (problems.length) throw new CardInvalid(problems, dir);

  const render = (card) => {
    const options = {
      resolveLink: (url) => resolveLink(url, card.rel, pages),
      onRawHtml: (count) =>
        console.warn(`[superloops] ${card.rel}: ${count} piece(s) of raw HTML, which the site does not show`),
    };
    return {
      title: renderInline(card.title, options),
      block: (markdown, dropTitle = false) => renderBlock(markdown, { ...options, dropTitle }),
    };
  };

  return {
    dir,
    loopTypes: loopTypeCards.map((card) => {
      const { title, block } = render(card);
      const { id, rel, group, places, stages, qualities } = card;
      return { id, path: rel, title, group, places, stages, qualities, summary: block(card.summary), sections: block(card.body, true) };
    }),
    superLoops: superLoopCards.map((card) => {
      const { title, block } = render(card);
      const { id, rel, phases, exits } = card;
      return { id, path: rel, title, phases, exits, sections: block(card.body, true) };
    }),
  };
}

/**
 * Where a card's link goes on the site. A link to another card goes to that card's page; a relative link to any
 * other file of the repository goes to that file on GitHub. Links with a scheme and links within the page stay.
 * @param {string} url  as the card writes it
 * @param {string} from  the card's path relative to the catalog folder
 * @param {Map<string, string>} pages  a card's path in the repository -> its page
 */
export function resolveLink(url, from, pages) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('#') || url.startsWith('//')) return url;
  const [, target, suffix] = /^([^?#]*)(.*)$/.exec(url);
  if (!target) return url;
  const file = target.startsWith('/')
    ? path.posix.normalize(decode(target).slice(1))
    : path.posix.join(CATALOG_IN_REPOSITORY, path.posix.dirname(from), decode(target));
  if (file.startsWith('../')) return url; // outside the repository: nothing to point at
  const page = pages.get(file);
  if (page) return page + (suffix.includes('#') ? suffix.slice(suffix.indexOf('#')) : '');
  const encoded = file.replace(/\/$/, '').split('/').map(encodeURIComponent).join('/');
  return `${config.repository}/blob/${config.branch}/${encoded}${suffix}`;
}

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** The frontmatter and the body of a catalog file; `data` is undefined when it has no frontmatter. */
function readCard(dir, rel) {
  const source = fs.readFileSync(path.join(dir, rel), 'utf8').replace(/\r\n/g, '\n');
  const match = FRONTMATTER.exec(source);
  if (!match) return { body: source };
  let data;
  try {
    data = parseYaml(match[1]);
  } catch (error) {
    return { problem: `the frontmatter is not valid YAML: ${error.message.split('\n')[0]}` };
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { problem: 'the frontmatter is not a mapping of fields' };
  }
  return { data, body: source.slice(match[0].length) };
}

/** id -> summary, as loop-types/index.yaml states it. */
function readSummaries(file) {
  let index;
  try {
    index = parseYaml(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`CatalogUnreadable: ${file}: ${error.message.split('\n')[0]}`);
  }
  const entries = Array.isArray(index?.loop_types) ? index.loop_types : [];
  return new Map(
    entries.filter((e) => e && typeof e.summary === 'string' && e.summary.trim()).map((e) => [String(e.id), e.summary]),
  );
}

/** The checks of a card's frontmatter fields; each failed one adds a problem for the card. */
function checker(card, problems) {
  const check = {
    ok: true,
    fail(reason) {
      check.ok = false;
      problems.push({ card, reason });
    },
    /** A one-line value the page shows: a non-empty scalar. Undefined when it is not one. */
    text(value, field) {
      if (value !== null && typeof value === 'object') {
        check.fail(`${field} is not a single value`);
        return undefined;
      }
      const text = value === undefined || value === null ? '' : String(value).trim();
      if (!text) check.fail(`the frontmatter has no ${field}`);
      return text || undefined;
    },
    /** The id: the page's address, so it must be the file's name. */
    id(value, file) {
      const id = check.text(value, 'id');
      if (id === undefined || `${id}.md` === file) return id;
      check.fail(`id ${JSON.stringify(id)} does not match the file name`);
      return undefined;
    },
    /** A list the page shows joined: absent or empty is none; a single value is a list of one. */
    list(value, field) {
      if (value === undefined || value === null) return [];
      const values = Array.isArray(value) ? value : [value];
      if (values.every((v) => v !== null && typeof v !== 'object')) return values.map(String);
      check.fail(`${field} is not a list of values`);
      return [];
    },
  };
  return check;
}

function isFolder(file) {
  return fs.existsSync(file) && fs.statSync(file).isDirectory();
}
