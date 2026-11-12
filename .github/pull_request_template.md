## What changes

<!-- One or two sentences. For a loop: the failure it catches, and its place in the super-loops. -->

## A loop added or changed

- [ ] The card names the failure in `## Why`, and the example's must-fire cases cover each kind of it
- [ ] `python3 plugin/parts/harness/scripts/catalog.py example <id>` prints VALID
- [ ] `python3 plugin/parts/harness/scripts/catalog.py check` prints OK
- [ ] `python3 plugin/parts/harness/scripts/catalog.py links <id>` prints no error
- [ ] No other card catches the same failure (or this pull request changes that card instead)
- [ ] Evidence that the loop runs somewhere, if there is any, is in the card's `links`, pinned to a commit
