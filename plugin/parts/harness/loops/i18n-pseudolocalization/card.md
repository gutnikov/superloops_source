---
id: i18n-pseudolocalization
title: "i18n and pseudo-localization"
summary: "A linter finds missing keys and hard-coded strings. E2E on a pseudo-locale shows truncated text."
sensor: computational
ilities: [compatibility]
places: [delivery/work, remediation/work, maintenance/work]
stages: [edit, ci]
speed: [seconds, minutes]
needs: [browser]
related: [e2e-browser, visual-screenshot-check, lint-with-fix-instructions]
links:
  - title: "Test your app with pseudolocales"
    url: "https://developer.android.com/guide/topics/resources/pseudolocales"
    author: "Android Developers"
    note: "en-XA and ar-XB, and the problems each one shows."
  - title: "CLI"
    url: "https://formatjs.github.io/docs/tooling/cli/"
    author: "FormatJS"
    note: "`formatjs verify` for missing keys, `formatjs compile --pseudo-locale`."
  - title: "eslint-plugin-i18next"
    url: "https://github.com/edvardchen/eslint-plugin-i18next"
    note: "the `no-literal-string` rule."
---

## Why

A hard-coded string or a missing key goes unnoticed while the app is used in one language; it shows only in
another locale. Text that fits in one language can be cut off in a longer one or break in a right-to-left one.

## How it works

The loop has two checks:

- **Lint.** A linter finds strings shown to users that bypass the i18n layer: eslint-plugin-i18next's
  `no-literal-string` "aims to avoid developers to display literal string directly to users without translating
  them". A key check compares every locale with the default one: `formatjs verify --source-locale en --missing-keys
  --structural-equality` reports keys missing from a locale and translations that lost a placeholder.
- **E2E on a pseudo-locale.** The test build has a pseudo-locale made from the default messages, and the E2E
  scenarios run in it. Android's English (XA) "adds Latin accents to the base English UI text, expands the original
  text by adding non-accented text, and brackets each message unit"; AR (XB) turns the messages right-to-left. In it,
  a hard-coded string shows as plain unaccented text, text cut off loses its closing bracket, a sentence glued from
  parts shows as two bracketed messages, and a layout that is not mirrored shows in the right-to-left run.

The agent moves a hard-coded string into the messages, adds the missing key, and fixes the layout that cut the text.

## Set up

- **One message catalogue, extracted from the code.** `formatjs extract`, or the framework's own extractor, writes the
  default locale's messages; the other locales are checked against them.
- **Pseudo-locales in development and test builds only.** On Android, `pseudoLocalesEnabled true` in the debug build
  type. On the web, compile `en-XA` and `en-XB` with `formatjs compile --ast --pseudo-locale <locale>`;
  "Pseudo-locales require `--ast`".
- **The E2E assertions.** Run the main scenarios ([e2e-browser](../e2e-browser/card.md)) in en-XA and in the
  right-to-left locale, and assert: no visible text without the pseudo-locale's accents; no element whose text is
  wider than its box; `dir="rtl"` on the root in the right-to-left run. Keep the screenshots for
  [visual-screenshot-check](../visual-screenshot-check/card.md), which judges the layout.
- **`run`** runs the linter and the key check, then the pseudo-locale E2E. It prints `file:line: hard-coded string
  "<text>"`, `<locale>: missing key <key>` and `<page> <selector>: text overflows in en-XA`, and exits non-zero on any
  of them.
- **Cases.** Must fire: a component with a literal button label; a locale file missing a key; a page with a
  fixed-width button whose en-XA label overflows. Must pass: the same component with its label from the messages, all
  keys present, and a button that grows with its text.
- **Wiring.** The linter in a PostToolUse hook on edits to UI files and in pre-commit; the key check and the
  pseudo-locale E2E in CI. The final run is in CI, and an `eslint-disable` of the rule goes through review.
