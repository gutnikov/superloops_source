# Wizard

The questions a person answers about a project, and the first set of loops each answer brings in. The site shows them
as a form; the `wizard` skill takes the answers, checks them against the repository and sets the project up. `S` is
this part's folder.

The catalog has over a hundred loop types; a project needs a few. The wizard picks them by two rules:

- **A core every project gets**: the loops that catch the failures agents cause almost anywhere, at almost no cost
  (`$S/steps/wizard-core.md`).
- **What the answers add**: one loop per thing the project has that unit tests lie about (a browser, a database, a
  published API, a model), per stage it reaches, per check a person stops doing, and per pain the person names. The
  rest of the catalog is listed for later and built only when a failure shows the need.

## Files

| Path | What |
|---|---|
| `$S/wizard.json` | The steps, their options (single or multiple choice), the loops and suggestions of each option, the rules that combine answers, the order loops are built in, the size of the first wave |
| `$S/steps/wizard-core.md` | Why each core loop is in every project, and the `verify` bundle |
| `$S/steps/wizard-<step>.md` | One per step: which loops each option brings in and why, what to suggest for later, and what to check in the repository before trusting the answer |
| `$S/scripts/wizard.py` | `check` validates `wizard.json` against the catalog and the prompts; `questions` lists the steps still open; `resolve` turns answers into a profile and a plan |

## The plan a set of answers makes

`wizard.py resolve answers.json` prints the profile (`kind`, `stages`, `tools`, `pains`, `autonomy`, `done_at`) and the
plan: the core, the loops of every chosen option, and the loops of every rule whose conditions the answers meet. The
loop types of a bundle become one loop: `build`, `type-check`, `lint-with-fix-instructions`, `red-green-tdd` and
`stop-hook` are the project's `verify`. Loops brought in by `pains` come right after `verify`; the rest follow `order`.
The first `first_wave` (5) are built now, the others are created as `proposed`.

## Changing the wizard

Edit `wizard.json` and the step's prompt together: `wizard.py check` fails when a loop id is not in the catalog, a
plan loop has no place in `order`, a rule names a step or an option that does not exist, or a prompt does not name
every option and every loop its step brings in. CI runs it with the catalog check.
