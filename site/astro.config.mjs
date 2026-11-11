// superloops.dev (spec SITE-1): Astro with static output, the pages built from the plugin's catalog at build time.
// The seams with the acceptance tests are in tests/site/README.md; the environment variables are seams 2 and 3.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { analyticsSnippet } from './src/config.mjs';
import { loadCatalog } from './src/lib/catalog.mjs';

const SITE = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY = path.dirname(SITE);

// The catalog folder, laid out like plugin/parts/harness. Unset: the repository's own.
const catalogDir = path.resolve(process.env.SUPERLOOPS_CATALOG || path.join(REPOSITORY, 'plugin', 'parts', 'harness'));

// Where the site is written. Unset: dist/, the folder wrangler.jsonc serves.
const outDir = path.resolve(process.env.SITE_OUT_DIR || path.join(SITE, 'dist'));

export default defineConfig({
  site: 'https://superloops.dev',
  output: 'static',
  outDir,
  // /loops/<id>/ is loops/<id>/index.html.
  build: { format: 'directory' },
  // The cards are rendered by src/lib/markdown.mjs; these keep any Markdown page Astro renders itself as raw.
  markdown: { smartypants: false, syntaxHighlight: false },
  devToolbar: { enabled: false },
  integrations: [superloops()],
  vite: {
    define: {
      __BUILD__: JSON.stringify({ catalogDir, version: version() }),
    },
  },
});

function superloops() {
  return {
    name: 'superloops',
    hooks: {
      // The build stops here, before anything is built, while the analytics token in src/config.mjs is empty or
      // when a card of the catalog cannot be shown (CardInvalid). The pages read the catalog again, in Vite's graph.
      'astro:config:setup': () => {
        analyticsSnippet();
        loadCatalog(catalogDir);
      },
      // With an outDir outside site/ (SITE_OUT_DIR), Astro 5 builds in a folder inside site/ and copies it over,
      // and the content layer's two module files come along. They are build internals, not part of the site.
      'astro:build:done': ({ dir }) => {
        for (const file of ['content-assets.mjs', 'content-modules.mjs']) {
          fs.rmSync(new URL(file, dir), { force: true });
        }
      },
    },
  };
}

/** version.txt: the short hash of the commit the site is built from. */
function version() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPOSITORY, encoding: 'utf8' }).trim();
  } catch (error) {
    throw new Error(`SiteVersionUnknown: \`git rev-parse --short HEAD\` failed in ${REPOSITORY}: ${error.message}`);
  }
}
