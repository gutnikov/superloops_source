/**
 * A card's Markdown to HTML, as GitHub shows it and as raw as the site is (SITE-1#7): GFM, heading ids for the
 * links to a section, and nothing else. No typographic replacement, no syntax highlighting (it writes style
 * attributes). Raw HTML in a card is left out (the build warns about it), so a card cannot bring a style in.
 */
import { toString } from 'mdast-util-to-string';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const parser = unified().use(remarkParse).use(remarkGfm).freeze();
const toHtml = unified().use(remarkRehype).use(rehypeSlug).use(rehypeStringify).freeze();

/**
 * @typedef {(url: string) => string} LinkResolver  where a link of the card goes on the site
 * @typedef {{ resolveLink: LinkResolver, onRawHtml?: (count: number) => void }} RenderOptions
 */

/**
 * A block of Markdown (a card's body, a summary) as HTML.
 * @param {string} markdown
 * @param {RenderOptions & { dropTitle?: boolean }} options  dropTitle: leave out a leading `# ` heading, which the
 *   page shows from the frontmatter's title instead
 */
export function renderBlock(markdown, options) {
  const tree = parse(markdown, options);
  if (options.dropTitle && tree.children[0]?.type === 'heading' && tree.children[0].depth === 1) {
    tree.children.shift();
  }
  return toHtml.stringify(toHtml.runSync(tree));
}

/**
 * A one-line value (a title) as inline HTML and as plain text. A value that is not one paragraph is shown as
 * written.
 * @param {string} markdown
 * @param {RenderOptions} options
 * @returns {{ html: string, text: string }}
 */
export function renderInline(markdown, options) {
  const tree = parse(markdown, options);
  const text = toString(tree);
  const hast = toHtml.runSync(tree);
  const blocks = hast.children.filter((node) => !(node.type === 'text' && !node.value.trim()));
  if (blocks.length !== 1 || blocks[0].type !== 'element' || blocks[0].tagName !== 'p') {
    return { html: escapeHtml(markdown), text: markdown };
  }
  return { html: toHtml.stringify({ type: 'root', children: blocks[0].children }), text };
}

function parse(markdown, { resolveLink, onRawHtml }) {
  const tree = parser.runSync(parser.parse(markdown));
  let rawHtml = 0;
  visit(tree, (node) => {
    if (node.type === 'link' || node.type === 'definition') node.url = resolveLink(node.url);
    if (node.type === 'html') rawHtml++;
  });
  if (rawHtml && onRawHtml) onRawHtml(rawHtml);
  return tree;
}

function visit(node, fn) {
  fn(node);
  for (const child of node.children ?? []) visit(child, fn);
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
