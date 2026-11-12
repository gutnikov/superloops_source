# Contributing

## Add or change a loop

A loop is one folder, `plugin/parts/harness/loops/<id>/`, with its card, `card.md`, its example, `example/`, and an
image if it has one. The plugin and the site both read the card, so it is the only place a loop is described. The
example is a working loop that catches the failure the card names and leaves correct work alone: a loop enters the
catalog only with one.

The format and the steps are in [plugin/parts/harness/loops/FORMAT.md](plugin/parts/harness/loops/FORMAT.md): copy
the template, fill in the card, build the example, then run

```bash
cd plugin/parts/harness
python3 scripts/catalog.py example <id>   # the example: every must-fire case fires, every must-pass case passes
python3 scripts/catalog.py index          # adds the loop to loops/index.yaml and the README's list
python3 scripts/catalog.py check          # every card, example and super-loop; needs PyYAML
python3 scripts/catalog.py links <id>     # every GitHub link pinned to a commit points at a file and lines that exist
```

A pull request that adds or changes a loop goes through two reviews:

1. **The formal review, in CI.** `catalog-check` and `example-check` run the commands above on the changed loops.
   The example runs as code from your pull request, with a read-only token, no secrets and a time limit.
2. **The review of what the loop says, by people.** The maintainers read the card against the catalog and its
   links: whether another loop already catches the same failure (then the change belongs in that card), whether
   each claim is what its link shows, and whether the must-fire cases cover the failures the card's `## Why` names.
   They comment on the pull request.

Evidence that the loop runs somewhere, a public project at a pinned commit, goes in the card's `links` when there
is any.

Every change under `plugin/` is merged by the owner (`.github/CODEOWNERS`).
