---
id: translation-sync
title: "Translations stamped with their source text"
summary: "Each translation records a hash of the text it was translated from; a changed original makes it stale, and a check fails on broken params, link ids and code spans."
sensor: computational
ilities: [compatibility, usability]
places: [delivery/work, delivery/release, maintenance/work]
stages: [local, ci]
speed: [seconds]
needs: []
agent: [worker]
related: [i18n-pseudolocalization, executable-docs, approved-fixtures]
links:
  - title: "services/site/src/i18n/check.ts"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/site/src/i18n/check.ts#L1-L12"
    author: "opencode (anomalyco)"
    note: "errors: a key the English lacks, params, link ids or code spans that differ; warnings: untranslated, English changed."
  - title: "check.ts: a hash of the English per entry"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/site/src/i18n/check.ts#L47-L54"
    author: "opencode (anomalyco)"
  - title: "check.ts: stamps are written only without errors"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/site/src/i18n/check.ts#L140-L147"
    author: "opencode (anomalyco)"
  - title: "test/i18n.test.ts"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/services/site/test/i18n.test.ts#L1-L11"
    author: "opencode (anomalyco)"
  - title: "The translator agent: website copy"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.opencode/agent/translator.md#L25-L34"
    author: "opencode (anomalyco)"
    note: "\"run it again until it reports 0 errors\", then --stamp; within 40% of the English width."
  - title: "packages/app/AGENTS.md: Localization"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/packages/app/AGENTS.md#L111-L126"
    author: "opencode (anomalyco)"
    note: "feature work adds English only; \"Do not translate from model knowledge alone\"; two independent corpora."
  - title: "The glossaries: a source for every rule"
    url: "https://github.com/anomalyco/opencode/blob/72616be4dbe772dc645640b5623cb3d6f4453bd3/.opencode/glossary/README.md#L58-L63"
    author: "opencode (anomalyco)"
---

## Why

A key-presence check passes on a translation that no longer says what the original says. When the English of a
button changes from "Delete" to "Archive", the old translation still sits under the same key, and every check of
missing keys is green. The user reads the old meaning. A translation also breaks in ways a reader misses: a
`{{count}}` dropped, a link id translated, a code span reworded. This loop ties each translation to the exact original
text it was made from, and checks the parts that must not change.

## How it works

Each locale has a stamp file next to it: for every translated entry, a hash of the original text it was translated
from. The check reads the original, the translation and the stamps, and sorts each entry:

- **stale** when the stamp differs from the hash of the current original: `todo <id> (English changed)`;
- **untranslated** when it has no value, or a value equal to the original, and no stamp;
- **an error** when the translation has a key the original does not, or its `{{params}}`, the ids of Markdown links or
  `` `code` `` spans differ from the original's.

The agent translates the entries the check lists, and runs it again until it reports no errors. Then it writes the
stamps for what it translated. opencode's check writes stamps only when there are no errors.

## Set up

- **The check and its stamps**: one stamp file per locale, committed, with a hash of the original per entry. A test
  runs the check for every locale and fails on any error.
- **The original language first.** Feature work adds the original strings only and leaves other locales absent, so
  the runtime falls back to the original; translations land in their own pull request after review. opencode:
  "Feature work adds English source strings only."
- **A stale entry is worse than a missing one.** The fallback shows the current meaning; a stale translation shows
  the old one. Before a release, every stale entry of a shipped locale is translated again or removed.
- **Rules for the translator**, in its prompt: keep params, link ids and code spans exactly; keep labels and buttons
  within 40% of the original's width; check terms against at least two independent corpora of the language's developer
  products, not the model's memory (opencode: "Do not translate from model knowledge alone"); review every value
  still equal to the original; name the corpora used, so that a native speaker reviews where it matters.
- **A glossary per locale**, each rule with the pull request or issue that motivated it.
- **`run`** prints, per locale, one line per entry that is not done, `<locale> <id>: stale|untranslated`, then one
  line per error, `<locale> <id>: <param|link|code> differs from the original`. It exits non-zero on any error, and
  on any stale entry when run with `--release`.
- **Cases.** Must fire: an original string changed after its translation was stamped (`stale`, failing with
  `--release`); a translation that drops `{{count}}`; a translated link id. Must pass: the main branch with fresh
  stamps; a new original string with no translation yet (untranslated, not an error).
- **Wiring:** the test in CI on every pull request; `run --release` in the release job; the translator agent started
  on the diff of changed original strings.

## Notes

- [i18n-pseudolocalization](../i18n-pseudolocalization/card.md) finds missing keys, hard-coded strings and text that
  does not fit; this loop finds translations that stopped matching their original.
- The same stamp works for any derived text that must follow an original: generated docs, a summary of a spec, a
  copy of a code sample.

## Agent step

A translator worker runs on the diff of changed original strings, or on the list `run` prints. It gets the
original, the current translations, the glossary and the rules, and returns the translated entries and the stamps, with review
notes that name the corpora it used and the terms it was unsure of. It does not block: the check decides, and a
native speaker reviews the pull request.
