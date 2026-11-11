# Step: phase

Is the project new, or does it already have code? The answer decides where the oracle comes from. In a new project,
nothing yet says what the code must do: the risk is building the wrong thing, and the cheapest loops fix the intent
and the rules early. In an existing project, the code and its tests already say what it does: the risk is breaking
it, and the first loop learns what is already broken before the agent touches anything.

Check the answer against the repository: a "new" project with a year of history is existing; an "existing" one with
no tests gets the loops of `new` as suggestions too.

## `new`: from scratch

Adds no loop beyond the core: there is nothing to protect yet, and `verify` grows with the first code.

Suggest, for when they become useful:

- `interview`: before the first feature, the agent asks about requirements, edge cases and trade-offs and writes the
  answers down. Worth it when the person has the product in their head and nowhere else.
- `task-restatement`: the agent restates each task before starting; cheap, for a person who gives short tasks.
- `architecture-fitness-functions`: layer rules are cheapest to set before the code exists that would break them.
  Propose it once the structure is decided.
- `acceptance-loop`: once requirements come as tickets or texts, they become an approved spec with acceptance tests
  that fail before the work.

## `existing`: existing project

Adds `run-tests-first`: before any change, the agent runs the whole suite and records which tests already fail. Without
it, the agent mistakes an old red test for its own regression and "fixes" it, or ignores its own regression as old.

Suggest:

- `behaviour-invariance`: for refactoring and upgrades, the gate that no expected value of an existing test changed.
- `dependency-updates`: an existing project has dependencies that age; bring it in when updates start breaking things.
- `approved-fixtures`: characterization snapshots of what the code does now, before the agent changes code no test
  covers.
- `code-coverage`: where the coverage report shows the code the agent is about to change has no tests.

Read the history before the plan: red CI runs, reverts and fix-up commits name the pains, and a pain moves its loop
into the first wave (`wizard-pains.md`).
