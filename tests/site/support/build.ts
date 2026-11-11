import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { expect } from '@playwright/test';
import { SITE_DIR } from './repo.ts';

export type BuildResult = {
  /** The exit code of `npm run build`; null when it was killed. */
  code: number | null;
  /** stdout and stderr, interleaved as they came. */
  output: string;
};

/**
 * Seams 1-3 of tests/site/README.md: `npm run build` in site/, with the output folder in SITE_OUT_DIR and, when
 * given, another catalog folder in SUPERLOOPS_CATALOG. Without it the build reads the repository's catalog.
 */
export function buildSite(options: { outDir: string; catalog?: string }): Promise<BuildResult> {
  const env: NodeJS.ProcessEnv = { ...process.env, SITE_OUT_DIR: options.outDir };
  delete env.SUPERLOOPS_CATALOG;
  if (options.catalog) env.SUPERLOOPS_CATALOG = options.catalog;
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: SITE_DIR, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    // spawn reports a missing cwd as "spawn npm ENOENT": say which folder is missing instead.
    child.on('error', (error) =>
      fs.existsSync(SITE_DIR)
        ? reject(error)
        : resolve({ code: null, output: `${SITE_DIR} does not exist: there is no site to build (${error.message})` }),
    );
    child.on('close', (code) => resolve({ code, output }));
  });
}

/**
 * Error CardInvalid (seam 3): the build exits non-zero, and its output says CardInvalid and names the card by
 * its path relative to the catalog folder (an absolute path contains it too).
 */
export function expectCardInvalid(build: BuildResult, card: string) {
  expect(
    { stopped: build.code !== 0, saysCardInvalid: build.output.includes('CardInvalid'), namesCard: build.output.includes(card) },
    `the build of a catalog where ${card} cannot be shown; its output ends with:\n${tail(build.output)}`,
  ).toEqual({ stopped: true, saysCardInvalid: true, namesCard: true });
}

/** The end of a build's output, for an error message. */
export function tail(output: string, lines = 30): string {
  return output.trimEnd().split('\n').slice(-lines).join('\n');
}
