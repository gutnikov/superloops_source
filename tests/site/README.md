# Acceptance tests of superloops.dev

The tests of the specs SITE-1 and SITE-2 (`superloops/specs/requirements/SITE-1.yaml`, `SITE-2.yaml`), derived
from the Event Model `superloops/specs/model/site.em.yaml` (contract `event-model/1`). There is one test per
example, titled with the example's name and tagged with its slice id and its requirement ids
(`@T01 @SITE-1#1 @SITE-1#2 @SITE-2#1 …`). They were written before the work and failed then: `red-run.txt` holds
the run before SITE-2 (the run before SITE-1 is in its git history).

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
2. **`SUPERLOOPS_CATALOG`.** The absolute path of a folder laid out like `plugin/parts/harness` (`loops/`,
   `super-loops/` and the rest). The build reads the cards from there: a loop's card is `loops/<id>/card.md`, and
   a folder whose name starts with `_` (`_template/`) is not a loop. Unset, it reads the repository's
   `plugin/parts/harness`. The tests set it to a copy of all of `plugin/parts`, because cards link to other parts.
3. **`SITE_OUT_DIR`, and `CardInvalid`.** `SITE_OUT_DIR` is the absolute path where the build writes the site;
   unset, the site picks its own folder. When a card cannot be shown, the build stops: it exits non-zero and its
   output contains `CardInvalid` and the card's path relative to the catalog folder, such as
   `loops/red-green-tdd/card.md` or `super-loops/remediation.md` (an absolute path contains it too). The tests
   break a card by emptying its title (`title: ""`); the plugin's own `scripts/catalog.py check` rejects such a
   card. (Not by removing the `title:` line: the check crashes on a loop card without one and names no card.)
4. **Output.** A folder of static files: `/` is `index.html`, `/loops/<id>/` is `loops/<id>/index.html`,
   `/super-loops/<id>/` is `super-loops/<id>/index.html`, and `/version.txt` is `version.txt`. A card's image is
   copied next to its page, byte for byte: `/loops/<id>/<file>` is `loops/<id>/<file>`, where `<file>` is the
   card's `image:` (`/loops/red-green-tdd/image.svg`). The tests serve the folder themselves, the way Cloudflare
   serves one (`support/serve.ts`, which sends an `.svg` as `image/svg+xml`); they need no preview server.
5. **`version.txt`.** One line: the short hash of the commit the site is built from, as `git rev-parse --short HEAD`
   prints it in this repository. The tests compare it with the same command on the commit they run on.
6. **`SITE_BASE_URL`.** When it is set (to `https://superloops.dev` after a deploy), every page the tests open is on
   that URL. The tests still build the site locally, because the build and the invalid-card builds are part of the
   states. Unset, the pages come from the local build. Local runs block the analytics beacon's requests; runs
   against `SITE_BASE_URL` let it load, because those page views are the production signal (SITE-1?4). The one
   exception is the image example: its catalog is a copy no deploy is built from, so its pages always come from a
   local build, and the beacon is blocked on them.
7. **Fields.** On a card page, each field of the read model is an element with `data-field="<field>"`, and the
   element's text is the value (whitespace collapsed).
   - A loop (`/loops/<id>/`, the LoopType read model) shows every field of its card, each in one element, and
     no other `data-field` element. The fields, how each is shown, and the red-green-tdd card's values:

     | `data-field` | Shown as | red-green-tdd |
     |---|---|---|
     | `title` | the card's `title` | `Unit tests, red/green TDD` |
     | `image` | the `<img>` itself, below | not on the page |
     | `summary` | the card's `summary` | `The agent writes a test and sees it fail, …` |
     | `sensor` | the value | `computational` |
     | `ilities`, `places`, `stages`, `speed`, `needs`, `agent`, `when`, `assesses` | a list | `testability, correctness`; `needs`: `none` |
     | `initiator`, `sync` | the value | not on the page |
     | `related` | a list of links, below | `acceptance-loop, mutation-testing` |
     | `links` | a list of entries, below | 5 entries |
     | `sections` | the card's body, below | `Why`, `How it works`, `Set up`, `Notes`, `Agent step` |

   - A list is the card's values in its order, joined with `", "`: `delivery/work, remediation/work`. A `speed`
     range is a list too: `[minutes, hours]` shows `minutes, hours`. A list the card has but empty (`needs: []`,
     `links: []`) shows `none`.
   - A field the card does not have is not on the page: no element with its `data-field`, not even an empty one.
     Only `image`, `agent`, `related`, `when`, `initiator`, `sync` and `assesses` may be missing; the four axes
     (`when`, `initiator`, `sync`, `assesses`) are on the page only of a loop whose card has them, which is a loop
     with `sensor: human` (`plan-approval`: `before`, `agent`, `blocking`, `plan`).
   - `title` and `summary` may be shown as the card writes them or rendered from their Markdown:
     ``Stop hook / `/goal` `` may show as `Stop hook / /goal`. Every other value is shown as the card writes it.
   - `related`: the ids, joined with `", "`, each id the text of a link to that loop's page,
     `<a href="/loops/<id>/">acceptance-loop</a>`. The tests compare where a link leads, so a relative `href` to
     the same page is the same.
   - `links`: the element holds one `<li>` per entry of the card's `links`, in the card's order (it is the `<ul>`,
     or holds one). An entry's text is its `title`, then `, by <author>` if it has an author, then ` — <note>`
     (a space, an em dash U+2014, a space) if it has a note. Where it has a `url`, its title is the text of a link,
     `<a href="<url>">`, with the url exactly as the card writes it; the author and the note are not in the link.
     An entry without a url has no link. The first entry of red-green-tdd:
     `<li><a href="https://andrewmurphy.io/stdlib/b139fcdd-2733-435b-a97f-6d7e47836719">Red/green TDD — Agentic
     Engineering Patterns</a>, by Simon Willison</li>`. With `links: []` the element's text is `none`, and it holds
     no `<li>`.
   - `image`: where the card has `image: <file>`, the page has `<img data-field="image" src="/loops/<id>/<file>"
     alt="<the loop's name>">` right under the title: the `<img>` is the element that comes next after the
     `data-field="title"` element (its next element sibling). The alt text is the title, as written or as its
     Markdown renders, as plain text. The file is the card's own, served next to the page (seam 4); the browser
     must be able to show it. A card without an image: no `data-field="image"` element and no `<img>` on its page.
   - A super-loop (`/super-loops/<id>/`): `title`, `phases`, `exits`. Lists are the card's values in its order,
     joined with `", "`; a list the card does not have is absent, or empty. `title` is shown as for a loop.
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
| `catalogOnMain` | `plugin/parts/harness` read card by card: 96 loop cards, one folder each (`loops/<id>/card.md`, none with an image), 4 super-loop cards |
| `siteBuilt` | the site built from it (seam 1), into `test-results/builds/` |
| `siteLive` | that build served locally, or `SITE_BASE_URL`; with the version it serves |
| `catalogValid` | Catalog -> valid: the build reads the repository's catalog unchanged |
| `catalogWithInvalidCard` | Catalog -> invalid: a copy of `plugin/parts` with the title of one card emptied (option `invalidCard`) |
| `catalogWithImage` | Catalog -> withImage: a copy of `plugin/parts` where `loops/red-green-tdd/` also has `image.svg` and its card says `image: image.svg`; the copy passes the plugin's check |
| `siteWithImage` | the site built from `catalogWithImage`, served locally, also with `SITE_BASE_URL` |
| `cloudflareDeploys` | Cloudflare -> deploys: the built site is what is served, locally or on `SITE_BASE_URL` |
| `cloudflareFails` | Cloudflare -> fails: a stub that throws; its test is `fixme` |

The Page Objects are `homePage`, `loopTypePage`, `superLoopPage` and `versionFile` (`screens[].pom`), in `pages/`.
`loopTypePage` covers two screens: LoopTypePage (`/loops/<id>/`) and LoopImageFile (`/loops/<id>/<image>`). The
image example points it at `siteWithImage` (`test.use` of `siteUnderTest` in its spec).

## Choices the contract left open

- **Super-loop cards** are the files of `super-loops/` with frontmatter: delivery, discovery, maintenance and
  remediation, as the state's note now says (SITE-1?5). `README.md` and `harness-level.md` are documents, with no
  frontmatter and no page.
- **"Every card"** means all 96 loops and all 4 super-loops. Each is checked against its own card, and the card
  the example names is also checked against the example's values. The example's card is found by its title.
- **"What the card holds"** on a loop page is every field of the card (SITE-2?1) and nothing else: a page with a
  `data-field` the card has no field for fails, such as SITE-1's `group` or `qualities` (SITE-2#4).
- **How a loop's fields are shown** where the examples give no rendering (seam 7): an absent field is not on the
  page; an empty list shows `none`, as the example's `needs` does; a `speed` range is a list; a `related` link's
  text is the id and it leads to `/loops/<id>/`; a `links` entry is `<title>, by <author> — <note>` with the title
  linked to the url; the image is an `<img>` that is the title's next element sibling, its `src` the file next to
  the page.
- **Which pages** in "a deploy puts the commit's site on superloops.dev": every page of each screen the example
  names. Page.analytics, Page.stylesheets and Page.language are checked on the home page, all 96 loops and all 4
  super-loops.
- **The invalid card** is the card each example names: `loops/red-green-tdd/card.md` (T01) and
  `super-loops/remediation.md` (T02).
- **The image** of `catalogWithImage` is a plain SVG of 240×120 written by the fixture; the example compares the
  file the site serves with its bytes.
