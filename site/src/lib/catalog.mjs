/**
 * The plugin's catalog, read at build time from a folder laid out like plugin/parts/harness: the loop cards
 * (loops/<id>/card.md, every field in the frontmatter, as loops/loop.schema.json and loops/FORMAT.md define them,
 * and the card's image next to it; a folder whose name starts with _ is the template, not a loop; the files of
 * loops/ are documents) and the super-loop cards (the files of super-loops/ with frontmatter; README.md and
 * harness-level.md have none: they are documents, with no page).
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

/**
 * The fields of a loop card (loops/loop.schema.json), each one shown on the loop's page. A card with any other
 * field cannot be shown: the page would hide part of what the card holds (SITE-2#1).
 */
const LOOP_FIELDS = new Set([
  'id',
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
]);

/** The fields of an entry of a loop card's links. */
const LINK_FIELDS = new Set(['title', 'url', 'author', 'note']);

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
 * @typedef {{ title: string, url?: string, author?: string, note?: string }} Link  an entry of a loop card's links
 * @typedef {{ file: string, src: string, source: string }} Image  file: as the card names it; src: where the site
 *   serves it, next to the page; source: the absolute path of the card's file
 * @typedef {{ id: string, path: string, title: Text, summary: Text, image?: Image, sensor: string,
 *   ilities: string[], places: string[], stages: string[], speed: string[], needs: string[], agent?: string[],
 *   related?: string[], links: Link[], when?: string[], initiator?: string, sync?: string, assesses?: string[],
 *   sections: string }} LoopType  a field the card does not have is undefined; sections is HTML
 * @typedef {{ id: string, path: string, title: Text, phases: string[], exits: string[], sections: string }} SuperLoop
 * @typedef {{ dir: string, loopTypes: LoopType[], superLoops: SuperLoop[] }} Catalog
 */

/**
 * Reads and renders every card of the catalog folder `dir`.
 * @param {string} dir  absolute
 * @returns {Catalog}
 */
export function loadCatalog(dir) {
  const loopsDir = path.join(dir, 'loops');
  const superLoopsDir = path.join(dir, 'super-loops');
  for (const folder of [loopsDir, superLoopsDir]) {
    if (!isFolder(folder)) {
      throw new Error(
        `CatalogUnreadable: ${dir} has no ${path.basename(folder)}/ folder. SUPERLOOPS_CATALOG must be a folder ` +
          'laid out like plugin/parts/harness.',
      );
    }
  }
  const problems = [];

  // First every card's frontmatter, so that a link from one card to another resolves to that card's page.
  const loopCards = [];
  const loopFolders = fs
    .readdirSync(loopsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort();
  for (const folder of loopFolders) {
    const rel = `loops/${folder}/card.md`;
    if (!fs.existsSync(path.join(dir, rel))) {
      console.warn(`[superloops] loops/${folder}/ has no card.md: it is not a loop, and has no page`);
      continue;
    }
    const card = readCard(dir, rel);
    if (!card.data) {
      problems.push({ card: rel, reason: card.problem ?? 'no frontmatter' });
      continue;
    }
    const { data } = card;
    const check = checker(rel, problems);
    for (const field of Object.keys(data).filter((field) => !LOOP_FIELDS.has(field))) {
      check.fail(`${field} is not a field of a loop card (loops/loop.schema.json), so the site cannot show it`);
    }
    const fields = {
      id: check.id(data.id, folder, 'its folder'),
      title: check.text(data.title, 'title'),
      summary: check.text(data.summary, 'summary'),
      image: check.image(data.image, path.join(dir, 'loops', folder)),
      sensor: check.text(data.sensor, 'sensor'),
      ilities: check.list(data.ilities, 'ilities'),
      places: check.list(data.places, 'places'),
      stages: check.list(data.stages, 'stages'),
      speed: check.list(data.speed, 'speed'),
      needs: check.list(data.needs, 'needs'),
      agent: check.list(data.agent, 'agent', { optional: true }),
      related: check.list(data.related, 'related', { optional: true }),
      links: check.links(data.links),
      when: check.list(data.when, 'when', { optional: true }),
      initiator: check.text(data.initiator, 'initiator', { optional: true }),
      sync: check.text(data.sync, 'sync', { optional: true }),
      assesses: check.list(data.assesses, 'assesses', { optional: true }),
    };
    if (check.ok) loopCards.push({ rel, body: card.body, ...fields });
  }

  // A related loop is a link to its page, so it must be a loop of the catalog.
  const loopIds = new Set(loopCards.map((card) => card.id));
  for (const card of loopCards) {
    for (const id of card.related ?? []) {
      if (!loopIds.has(id)) problems.push({ card: card.rel, reason: `related names ${id}, which is not a loop of the catalog` });
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
    const id = check.id(card.data.id, file.replace(/\.md$/, ''), 'the file name');
    const title = check.text(card.data.title, 'title');
    const phases = check.list(card.data.phases, 'phases', { optional: true }) ?? [];
    const exits = check.list(card.data.exits, 'exits', { optional: true }) ?? [];
    if (check.ok) superLoopCards.push({ rel, body: card.body, id, title, phases, exits });
  }

  const pages = new Map();
  for (const [cards, route] of [[loopCards, 'loops'], [superLoopCards, 'super-loops']]) {
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
      inline: (markdown) => renderInline(markdown, options),
      block: (markdown, dropTitle = false) => renderBlock(markdown, { ...options, dropTitle }),
    };
  };

  return {
    dir,
    loopTypes: loopCards.map(({ rel, body, title, summary, image, ...fields }) => {
      const { inline, block } = render({ rel });
      return {
        ...fields,
        path: rel,
        title: inline(title),
        summary: inline(summary),
        ...(image && { image: { ...image, src: `/loops/${fields.id}/${encodeURIComponent(image.file)}` } }),
        sections: block(body, true),
      };
    }),
    superLoops: superLoopCards.map((card) => {
      const { inline, block } = render(card);
      const { id, rel, phases, exits } = card;
      return { id, path: rel, title: inline(card.title), phases, exits, sections: block(card.body, true) };
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

/** The checks of a card's frontmatter fields; each failed one adds a problem for the card. */
function checker(card, problems) {
  const absent = (value) => value === undefined || value === null;
  const check = {
    ok: true,
    fail(reason) {
      check.ok = false;
      problems.push({ card, reason });
    },
    /**
     * A one-line value the page shows: a non-empty scalar. Undefined when it is not one, or when the card does not
     * have it and may leave it out (`optional`).
     */
    text(value, field, { optional = false } = {}) {
      if (optional && absent(value)) return undefined;
      if (value !== null && typeof value === 'object') {
        check.fail(`${field} is not a single value`);
        return undefined;
      }
      const text = absent(value) ? '' : String(value).trim();
      if (!text) check.fail(`the frontmatter has no ${field}`);
      return text || undefined;
    },
    /** The id: the page's address, so it must be the name of the card's folder or file. */
    id(value, expected, what) {
      const id = check.text(value, 'id');
      if (id === undefined || id === expected) return id;
      check.fail(`id ${JSON.stringify(id)} is not ${what}, ${expected}`);
      return undefined;
    },
    /**
     * A list the page shows joined; a single value is a list of one. The card must have it, unless it may leave it
     * out (`optional`): then undefined when it does.
     */
    list(value, field, { optional = false } = {}) {
      if (absent(value)) {
        if (!optional) check.fail(`the frontmatter has no ${field}`);
        return undefined;
      }
      const values = Array.isArray(value) ? value : [value];
      if (values.every((v) => v !== null && typeof v !== 'object')) return values.map(String);
      check.fail(`${field} is not a list of values`);
      return undefined;
    },
    /** Where to read more: a list of entries, each with a title, and a url, an author and a note where it has them. */
    links(value) {
      if (absent(value)) {
        check.fail('the frontmatter has no links');
        return undefined;
      }
      if (!Array.isArray(value)) {
        check.fail('links is not a list of entries');
        return undefined;
      }
      return value.map((entry, index) => {
        const at = `links[${index}]`;
        if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
          check.fail(`${at} is not an entry with a title`);
          return undefined;
        }
        for (const field of Object.keys(entry).filter((field) => !LINK_FIELDS.has(field))) {
          check.fail(`${at}.${field} is not a field of a link (title, url, author, note)`);
        }
        const link = { title: check.text(entry.title, `${at}.title`) };
        for (const field of ['url', 'author', 'note']) {
          const text = check.text(entry[field], `${at}.${field}`, { optional: true });
          if (text !== undefined) link[field] = text;
        }
        return link;
      });
    },
    /** The image: a file of the card's folder, which the site serves next to the page. Undefined when there is none. */
    image(value, folder) {
      const file = check.text(value, 'image', { optional: true });
      if (file === undefined) return undefined;
      if (file !== path.basename(file) || file === '.' || file === '..' || file.includes('\\')) {
        check.fail(`image ${JSON.stringify(file)} is not the name of a file in the card's folder`);
        return undefined;
      }
      const source = path.join(folder, file);
      if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
        check.fail(`image ${file} is not in the card's folder`);
        return undefined;
      }
      return { file, source };
    },
  };
  return check;
}

function isFolder(file) {
  return fs.existsSync(file) && fs.statSync(file).isDirectory();
}
