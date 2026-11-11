import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repository root: tests/site/support/ is three levels below it. */
export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/** The site's npm project (seam 1 in tests/site/README.md). */
export const SITE_DIR = path.join(REPO, 'site');

/** The catalog as it is on main: the folder the site builds from by default (seam 2). */
export const CATALOG_DIR = path.join(REPO, 'plugin', 'parts', 'harness');

/**
 * The deployed site to check instead of a local build (seam 6), e.g. https://superloops.dev.
 * Unset: the tests build the site and serve the build themselves.
 */
export const SITE_BASE_URL = process.env.SITE_BASE_URL?.replace(/\/+$/, '') || undefined;

/** The short hash of the commit checked out here: what version.txt must hold (seam 5). */
export function shortHead(): string {
  return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim();
}

/** From SITE-1#6 and the example "a deploy puts the commit's site on superloops.dev". */
export const REPOSITORY_URL = 'https://github.com/gutnikov/superloops';

/** Cloudflare Web Analytics' manual snippet loads its beacon from here (SITE-1#5). */
export const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
