# Acceptance tests of superloops.dev

The tests of the spec SITE-1 (`superloops/specs/requirements/SITE-1.yaml`), derived from the Event Model
`superloops/specs/model/site.em.yaml` (contract `event-model/1`). There is one test per example, titled with the
example's name and tagged with its slice id and its requirement ids (`@T01 @SITE-1#1 @SITE-1#2`). They were written
before the site and failed then: `red-run.txt`.

```bash
cd tests/site && npm ci                      # Playwright 1.63.0, Chromium build 1243
npm test                                     # against a local build of site/
SITE_BASE_URL=https://superloops.dev npm test   # the same tests, the pages opened on the deployed site
npm run test:fixtures                        # the contract specs of the fixtures
npm run typecheck
```

## The seams: what the tests need from site/

This is the contract between the tests and the site. The site is Astro with static output, deployed to Cloudflare.

1. **Build.** `npm run build` in `site/` builds the site and exits 0. Its dependencies are installed beforehand
   (`npm ci` in `site/`). The tests run builds one at a time, because they share the `site/` folder and its cache.
2. **`SUPERLOOPS_CATALOG`.** The absolute path of a folder laid out like `plugin/parts/harness` (`loop-types/`,
   `super-loops/` and the rest). The build reads the cards from there. Unset, it reads the repository's
   `plugin/parts/harness`. The tests set it to a copy of all of `plugin/parts`, because cards link to other parts.
3. **`SITE_OUT_DIR`, and `CardInvalid`.** `SITE_OUT_DIR` is the absolute path where the build writes the site;
   unset, the site picks its own folder. When a card cannot be shown, the build stops: it exits non-zero and its
   output contains `CardInvalid` and the card's path relative to the catalog folder, such as
   `loop-types/testing/red-green-tdd.md` (an absolute path contains it too). The tests break a card by removing the
   `title:` line from its frontmatter; the plugin's own `scripts/catalog.py check` rejects such a card.
4. **Output.** A folder of static files: `/` is `index.html`, `/loops/<id>/` is `loops/<id>/index.html`,
   `/super-loops/<id>/` is `super-loops/<id>/index.html`, and `/version.txt` is `version.txt`. The tests serve the
   folder themselves, the way Cloudflare serves one (`support/serve.ts`); they need no preview server.
5. **`version.txt`.** One line: the short hash of the commit the site is built from, as `git rev-parse --short HEAD`
   prints it in this repository. The tests compare it with the same command on the commit they run on.
6. **`SITE_BASE_URL`.** When it is set (to `https://superloops.dev` after a deploy), every page the tests open is on
   that URL. The tests still build the site locally, because the build and the invalid-card builds are part of the
   states. Unset, the pages come from the local build. Local runs block the analytics beacon's requests; runs
   against `SITE_BASE_URL` let it load, because those page views are the production signal (SITE-1?4).
7. **Fields.** On a card page, each field of the read model is an element with `data-field="<field>"`, and the
   element's text is the value:
   - loop type (`/loops/<id>/`): `title`, `group`, `places`, `stages`, `qualities`, `summary`. A super-loop
     (`/super-loops/<id>/`): `title`, `phases`, `exits`.
   - Lists are the card's values in its order, joined with `", "`, such as `delivery/work, remediation/work`. A list
     the card does not have is absent, or empty. The human-in-the-loop cards have no `qualities`, and 19 cards have
     no `stages`.
   - `group` is the group's folder name (`testing`). `summary` is the card's summary as `loop-types/index.yaml`
     states it. `title` and `summary` may be shown as the card writes them or rendered from their Markdown:
     ``Stop hook / `/goal` `` may show as `Stop hook / /goal`.
   - `sections` is one element. It holds the card's `## ` sections in order. Each section starts with an `<h2>`
     holding its name and goes up to the next `<h2>`; it may be flat or wrapped in a `<section>`. The text under
     each heading is compared with the card's Markdown as rendered, with whitespace ignored. Every other character
     must match: no typographic replacement (Astro's `smartypants` off) and no added text.
8. **Every page** (home, loop types, super-loops). The Cloudflare Web Analytics beacon is in the built HTML,
   exactly once, as Cloudflare's manual snippet:
   `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "…"}'>`.
   It must not also be injected at the edge, which would count every view twice. There is no banner, which the
   tests check as no dialog, no button, and no text about cookies or consent outside the card's own fields. There
   are no styles: no `<link rel="stylesheet">`, no `<style>` and no `style=` attribute. Astro's syntax highlighting
   writes `style=` attributes, so it has to be off.
9. **Language.** Every page (home, loop types, super-loops) is `<html lang="en">`: the `lang` attribute of the
   document's root element is exactly `en`, as Page.language states it (not `en-US`, not missing).
10. **Home.** A link whose target is exactly `https://github.com/gutnikov/superloops`.

## States and outcomes: the fixtures

`support/fixtures.ts` has one fixture per state and per outcome, named as in the contract. Each one has a contract
spec in `_fixtures/`.

| Fixture | Is |
|---|---|
| `catalogOnMain` | `plugin/parts/harness` read card by card: 96 loop types in 12 groups, 4 super-loop cards |
| `siteBuilt` | the site built from it (seam 1), into `test-results/builds/` |
| `siteLive` | that build served locally, or `SITE_BASE_URL`; with the version it serves |
| `catalogValid` | Catalog -> valid: the build reads the repository's catalog unchanged |
| `catalogWithInvalidCard` | Catalog -> invalid: a copy of `plugin/parts` with the `title:` of one card removed (option `invalidCard`) |
| `cloudflareDeploys` | Cloudflare -> deploys: the built site is what is served, locally or on `SITE_BASE_URL` |
| `cloudflareFails` | Cloudflare -> fails: a stub that throws; its test is `fixme` |

The Page Objects are `homePage`, `loopTypePage`, `superLoopPage` and `versionFile` (`screens[].pom`), in `pages/`.

## Choices the contract left open

- **Super-loop cards** are the files of `super-loops/` with frontmatter: delivery, discovery, maintenance and
  remediation, as the state's note now says (SITE-1?5). `README.md` and `harness-level.md` are documents, with no
  frontmatter and no page.
- **"Every card"** means all 96 loop types and all 4 super-loops. Each is checked against its own card, and the
  card the example names is also checked against the example's values. The example's card is found by its title.
- **Which pages** in "a deploy puts the commit's site on superloops.dev": every page of each screen the example
  names. Page.analytics, Page.stylesheets and Page.language are checked on the home page, all 96 loop types and
  all 4 super-loops.
- **The invalid card** is the card each example names: `loop-types/testing/red-green-tdd.md` (T01) and
  `super-loops/remediation.md` (T02).
