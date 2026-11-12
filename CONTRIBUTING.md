# Contributing

## Add or change a loop

A loop is one folder, `plugin/parts/harness/loops/<id>/`, with its card, `card.md`, its example, `example/`, its
evals, `evals/`, and an image if it has one. The plugin, the site and the loop's skill all come from the card, so it
is the only place a loop is described. A loop enters the catalog only with all three proofs:

- **It can fire.** The example is a working loop that catches the failure the card names and leaves correct work
  alone.
- **An agent builds it.** Given the loop's skill, an agent sets the loop up in a small project and validates it,
  and does better than without the skill.
- **The skill loads when it should.** It loads when a person describes the failure, and not for unrelated work.

The format and the steps are in [plugin/parts/harness/loops/FORMAT.md](plugin/parts/harness/loops/FORMAT.md): copy
the template, fill in the card, build the example, then run

```bash
cd plugin/parts/harness
python3 scripts/catalog.py example <id>   # the example: every must-fire case fires, every must-pass case passes
python3 scripts/catalog.py eval <id>      # the evals, with and without the skill; writes evals/REPORT.json (needs a
                                          # model key, costs money: --max-cost-usd caps it)
python3 scripts/catalog.py index          # adds the loop to loops/index.yaml and the README's list
python3 scripts/catalog.py check          # every card, example and super-loop; needs PyYAML
python3 scripts/catalog.py links <id>     # every GitHub link pinned to a commit points at a file and lines that exist
```

A pull request that adds or changes a loop goes through two reviews:

1. **The formal review, in CI.** `catalog-check` and `example-check` run the commands above on the changed loops,
   except `eval`: CI checks that `evals/REPORT.json` passed and is for the current card, example and cases, and
   that the skill built from the card passes `claude plugin validate --strict`. The example runs as code from your
   pull request, with a read-only token, no secrets and a time limit.
2. **The review of what the loop says, by people.** The maintainers read the card against the catalog and its
   links: whether another loop already catches the same failure (then the change belongs in that card), whether
   each claim is what its link shows, whether the must-fire cases cover the failures the card's `## Why` names, and
   whether the eval cases test what the card says. They run the evals again on their machine, after reading the
   cases' scaffold scripts, and comment on the pull request. The `review-loop` skill of the plugin runs all of this
   and drafts the comment; run it on your own loop before you open the pull request: `/review-loop
   plugin/parts/harness/loops/<id>`.

Evidence that the loop runs somewhere, a public project at a pinned commit, goes in the card's `links` when there
is any.

Every change under `plugin/` is merged by the owner (`.github/CODEOWNERS`).
