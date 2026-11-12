# Agent formats

Agents that are steps of loops talk to each other and to scripts through these formats, and through nothing else.
They are the only part of an agent the harness fixes in advance: an agent's prompt, checklist and tools are
designed for its loop, but what it returns is one of the shapes below, so a finding verifier can check any
reviewer's findings and `loops.py eval-score` can score any agent.

Each format is one JSON object; a list of them is JSON Lines (one object per line).

## Finding

What a reviewer, a guard or an explorer reports. One finding per object.

```json
{"id": "F1", "file": "api/billing.go", "line": 142, "severity": "high", "rule": "credits-reserved",
 "message": "Two requests pass the balance check before either is charged.",
 "evidence": "billing.go:131 reads the balance; billing.go:142 charges after the render returns."}
```

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | unique within one run |
| `file`, `line` | when the finding is in code | where to look; `line` may be omitted for a whole file |
| `severity` | yes | `high` (blocks), `medium`, `low` |
| `rule` | yes | the checklist item, lens or requirement it breaks |
| `message` | yes | what is wrong, in one sentence |
| `evidence` | yes | what shows it: code lines, a command and its output, a screenshot path |

## Finding check

What a finding verifier returns for one finding it was given.

```json
{"finding": "F1", "status": "CONFIRMED", "evidence": "Ran the two requests in parallel: both returned 202."}
```

`status`: `CONFIRMED` (shown true), `PLAUSIBLE` (consistent with the code, not shown), `REFUTED` (shown false).

## Verdict

What a refuter, a guard or a judge returns about one claim or artifact, and what a gate prints.

```json
{"verdict": "fail", "reasons": ["The export button downloads 0 rows when the table is filtered."],
 "evidence": ["probe screenshot: test-results/probe.png", "GET /api/export?filter=… returned []"]}
```

| Field | Meaning |
|---|---|
| `verdict` | `pass` or `fail`; a judge may add `"score"` per criterion of its rubric |
| `reasons` | why, one sentence each; empty when `pass` |
| `evidence` | what was run or looked at |

A loop that runs an agent maps the verdict to its exit code: `pass` → 0, `fail` → 1. A loop whose agent is not
`gate` in `superloops/agents.yaml` prints the verdict and exits 0: an agent that is not calibrated advises, it does
not block.

## Diagnosis

What an investigator returns. It never blocks.

```json
{"cause": "The migration runs after the app starts on the preview.", "evidence": ["deploy log line 88: …"],
 "next": "Run migrations in the release step before the app's health check."}
```

## When an agent does not return its format

The loop that runs an agent checks what it returns before anything reads it:

- **The output is validated against the format's schema.** An object that does not match goes back to the agent as
  an error that names each field: what is missing, what has the wrong type. The agent fixes it and returns again,
  within its turn limit.
- **Returning is a tool call, the only way to finish.** An agent that stops without returning has failed; its prose
  is not parsed for a verdict.
- **Limits, then one last turn.** Each agent has a turn limit and a time limit, 30 turns and 10 minutes by default.
  When the agent reaches one of them, or stops without returning, it gets one more turn, of at most a minute: it
  must return its best answer now, say that the work was interrupted, and call nothing else.
- **The loop always learns why it ended.** What reaches the loop is the result and one of `done`, `timeout`,
  `max-turns`, `no-result` or `aborted`. Anything but `done` is not a pass: an advising agent's loop prints the reason,
  and a `gate` agent's loop fails.

gemini-cli's subagents finish this way: through `complete_task`, its argument checked against the agent's schema,
with a grace turn of 60 seconds.

Where the loop cannot give the agent a return tool, as when it drives a coding agent's CLI headless, the format comes
as a tagged block in the agent's output, and the rules above still hold. sandcastle (Matt Pocock) does it this way:

- **Work, then report, in one session.** The work runs on its own prompt. A second prompt resumes that session to
  emit the block and nothing else ("Do not change files. Do not run commands."), and the block's closing tag ends
  the run.
- **The prompt is checked first.** A run whose prompt does not contain the opening tag fails before the agent
  starts.
- **The last block counts**, so an agent that corrects itself is not punished. Nothing else is forgiven: invalid JSON
  fails, since a tolerant parser "Hides genuine model failures behind a forgiving parser".
- **A bad block is retried in the same session, on a budget.** The retry prompt states "Retries remaining after this
  attempt: N", the problem, the parser's detail and the block it matched, and ends "Emit only a corrected <tag>
  block. Do not change files or run commands." sandcastle allows 2 retries; after the last, the run fails with the
  session id, so the caller can still resume it.

## Evals

`superloops/agents/<agent-id>/evals/<case>/` holds what the agent gets (its `input/`, in the shape its loop gives it)
and `expected.json`:

```json
{"verdict": "fail"}
```

or, for an agent that reports findings:

```json
{"findings": [{"file": "api/billing.go", "line": 142, "rule": "credits-reserved"}]}
```

`{"findings": []}` is a must-pass case: the agent must report nothing of severity `high`.

Each run of the whole eval set is one file, `superloops/agents/<agent-id>/results/<run>.jsonl`, one line per case:

```json
{"case": "parallel-charge", "verdict": "fail", "findings": [{"id": "F1", "file": "api/billing.go", "line": 140, "severity": "high", "rule": "credits-reserved", "message": "…", "evidence": "…"}]}
```

A run matches a case when the verdicts are equal, or when every expected finding has a reported finding in the
same file, within 3 lines, with the expected `rule` if one is given, and a must-pass case has no `high` finding.

## Outcome

What happened to one verdict in real use, appended to `superloops/agent-outcomes.jsonl` by `loops.py outcome`:

```json
{"at": "2026-11-10T12:04:11", "agent": "code-reviewer", "loop": "review", "outcome": "false-positive",
 "note": "F3: the null check is two lines above"}
```

`outcome`: `confirmed`, `false-positive` (it fired and was wrong), `missed` (a failure it should have caught got
through), `overridden` (a person decided against it).

## Sources

- gemini-cli (Google), [`local-executor.ts`: the rule to finish through `complete_task`](https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/agents/local-executor.ts#L1495-L1506)
  and [the final warning](https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/agents/local-executor.ts#L423-L447);
  [`complete-task.ts`: the schema check](https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/tools/complete-task.ts#L82-L107);
  [`types.ts`: 30 turns and 10 minutes](https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/agents/types.ts#L51-L56);
  [`local-invocation.ts`: the termination reason the caller gets](https://github.com/google-gemini/gemini-cli/blob/e5d88fb2c036ce7e0c27131469cd963221b9d9e7/packages/core/src/agents/local-invocation.ts#L313-L321).
- sandcastle (Matt Pocock), [`run-with-extraction.ts`: the report pass resumes the work's session](https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/shared/run-with-extraction.ts#L21-L55)
  and [its prompt](https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/.sandcastle/agent-workflows/review/extraction.md#L1-L5);
  [ADR 0010: the tag in the prompt, the last match, no tolerant parsing](https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/docs/adr/0010-structured-output.md#L9-L22);
  [`run.ts`: the retry prompt](https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/src/run.ts#L54-L93)
  and [the retry in the same session](https://github.com/mattpocock/sandcastle/blob/14bdcdd1d520a206ace071242f503a715152f23e/src/run.ts#L937-L990).
