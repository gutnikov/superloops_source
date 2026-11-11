---
id: document-review
title: "Review of document texts"
summary: "The agent writes a brief, not the document. A separate writer writes the text from the brief. A fact check returns invented and missing facts; a reviewer returns error-pattern findings."
sensor: inferential
ilities: [maintainability, correctness]
places: [delivery/work, discovery/gate, harness:delivery/work]
stages: [local]
speed: [minutes]
needs: []
agent: [reviewer]
related: [knowledge-base-doc-lint, agent-code-review, interview]
links:
  - title: "Plain language guide series"
    url: "https://digital.gov/guides/plain-language"
    author: "U.S. General Services Administration"
    note: "adapted from PlainLanguage.gov, the home of the Federal Plain Language Guidelines that the en/ package follows."
  - title: "Style guides"
    url: "https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/"
    author: "Government Digital Service"
    note: "GOV.UK's style guides, with the A to Z style guide."
---

## Why

A text written without a brief invents facts and omits what the reader needs, and the reader cannot tell the
invented facts from the true ones. With every fact and its source in the brief, a fact check can name each invented
or missing claim. The brief check (step 2 below) finds gaps before any text exists. In rutalk, it covered 86% of the
gaps that review and revision found later. One such gap is what to do if something goes wrong. No rewriting closes these
gaps: only a fact or a plain "we don't know" in the brief does.

## How it works

The agent does not write the document itself. It writes a brief. A separate writer writes the text from the brief, and then the text is checked. In this card, "the agent" means the agent that writes the brief and answers questions about it. "The writer" means the writer of the language package `en/` (see Set up), and "the user" means the person the agent can ask.

1. **Brief.** The agent writes down:
   - what the text is
   - every fact, with its source
   - its own conclusion, with reasons
   - what is not known
   - who the reader is and what they must do
2. **Brief check** (`check-brief`). A model reads the brief through the reader's eyes and asks up to 5 questions about:
   - what to do if something goes wrong
   - exact numbers instead of "about"
   - unexplained terms
   - whom to contact
   - contradictions

   The agent answers the questions:
   - It first answers from the code and documents.
   - It asks the user about anything it cannot find, in one message, and waits for the answer.
   - If there is no one to ask (automation, a nightly run), it writes "we don't know".

   The answers go into the brief, and "we don't know" counts as an answer.
3. **Writing** (`write`). The writer writes the text from the brief only. Its system prompt is the package's writer prompt, `writing-a-text.md`.
4. **Two checks in parallel** (`check`):
   - A fact check compares the text with the brief. It returns `invented` (claims not in the brief) and `missing` (facts the reader needs).
   - A reviewer checks the text against a catalogue of error patterns. It returns findings with a code, a severity of 1–4 and a location.

   For an important text (an outage, a price increase, anything legally significant), run the review twice on the same text, then fix what both reviews found.
5. **Sorting the findings, once:**
   - **A finding that needs a fact the brief lacks** (often M-IDEAL: the text does not say what to do if something goes wrong). The agent looks for the fact in the code or asks the user, then adds it to the brief. If there is no new fact, the agent writes "we don't know" into the brief. Either way, it goes back to step 3, once.
   - **Severity 1–2 findings, `invented` and `missing`.** The writer makes one revision (`revise`). Severity 3–4 findings go into the revision only when the fix is obvious (`revise --max-severity 4`). After the revision, one more fact check runs (`check --facts-only`). Anything the revision returns in `unresolved` is a missing fact: handle it as in the point above.
   - **The last fact check finds an invented claim again.** The agent deletes that sentence from `text.md` itself, with no new round.

   A second review of the revised text never runs.
6. **Delivery.** In a chat, the agent posts `text.md` as it is. For a file, it copies `text.md` to where the file belongs. A person reads the text. If the text has to change after the checks, it is a new text: edit the brief and run the steps again.

## Set up

- The [`text-quality`](../../../text-quality/README.md) part of superloops. Its
  `scripts/talk.py` runs each step as a separate, isolated `claude -p` call: `new`, `check-brief`, `write`,
  `check`, `revise`. Its `README.md`, `en/README.md` (process and measurements) and `en/review/error-patterns.md`
  (the error catalogue) hold the details behind this card.
- `claude` (the Claude Code CLI) in PATH, with network access.
- The language package `en/` (US Federal Plain Language Guidelines, GOV.UK style guide, Strunk). It was carried
  over from rutalk, an earlier Russian package that is not in this repository; the error codes are rutalk's.
- Runs are kept in `superloops/.runs/`, which `superloops/.gitignore` keeps out of git.
- Do not change the package's prompts by hand: a change goes through the package's test bench (`en/lab/`) and its
  measurement.
- **The `run`** takes a run folder. The checks of the text advise, they do not block: the agent sorts their findings
  once (step 5), and a person reads the text. What `run` checks itself: every fact line of `brief.md` has `Source:`
  (an `Agent's conclusion` or `Unknown` line needs none), the brief names the reader and what they must do, and no
  `invented` quote of the last fact check (`facts.json`) is still in `text.md`. It prints one line per problem, such
  as `brief.md:<line>: fact without Source:`, and exits non-zero on any.
- **Cases.** Must fire: a brief with a fact line without `Source:`; a `text.md` that still holds a quote the last
  fact check marked `invented`. Must pass: a run with a complete brief and no invented quote left.
- **Wiring.** Step 6 of "Building a loop" ([the harness](../../README.md)) runs it on every `LOOP.md` and agent
  prompt before the commit, and `/superloops` writes by it the texts a person decides on. Each step is a separate
  `claude -p` call, so the agent that wrote the brief never grades the text.

### Scope

Any document written to be read by agents or people: specs, plans, design documents, `docs/` and README files,
AGENTS.md, agent and skill prompts, this catalog.

Not correspondence: chat replies, comments in threads, messages, confirmations, status lines.

### On a document that already exists

The part writes a new text from a brief. To check a text that is already written (an agent prompt, a `LOOP.md`):

1. Write the brief from the document's sources: requirements, decisions, the passages it is built on. Put the
   current text in `text.md` of the run.
2. `check`, then `revise --no-facts` for review findings of severity 1–3, then `check --facts-only`.
3. Sort the fact-check findings yourself: the brief rarely holds every fact the author used on purpose, so some
   `invented` items are fair. Read the whole diff of the revision.

What the revision got wrong when 88 cards of this catalog went through it (2026-11-08): it dropped "about" from
approximate numbers, extended a limit to a case the brief's facts did not cover, added a made-up example as a fact,
promised that the cited pages hold details they do not, and removed a correct link. The fact recheck caught most of
these; reading the diff caught the rest.

## Notes

- rutalk's figure of 3–4 times fewer errors and invented facts comes with no baseline or sample size; rely on the
  `en/` measurement below.
- `en/`: the measurement compares the writer prompt `writing-a-text.md` with no prompt (`lab/prompts/baseline.md`). The test used 12 held-out briefs, Sonnet and Haiku as writers, and ran once. Review findings fell from 4.04 to 1.71 per text (−58%), and invented facts from 3.08 to 0.42 per text.
- What remains is mostly M-IDEAL: the text does not say what to do if something goes wrong. The brief closes it,
  not the writer.
- A review → revise loop does not help: in rutalk, a second round left the same number of findings and added
  invented facts. For `en/` this is still a hypothesis, but the rule is the same.
- The reviewer is noisy. In rutalk, a second review of the same texts reproduced 57% of the findings at severity 2, 53% at severity 3 and 47% at severity 4.
- The brief check covered 86% of the gaps that review and revision found later (rutalk).
- Cost in rutalk: by its own measurements, an estimated $0.36 a text for the whole run, almost all of it the review. The first review in a session, before the cache warms up, cost $1.07 on a trial run.
- Cost in `en/`: the review costs $0.54–0.58 a text and the Sonnet writer $0.01. The fact check's cost was not recorded, so `en/` has no measured total per text.
- Time: the steps that do not wait for answers take an estimated two minutes, one and a half of them for the review.
- Do not ask the writer for markers such as "[to be confirmed]": the reviewer counts the gap anyway. A gap is
  closed by a fact or by "we don't know" in the brief.
- The facts for a text's brief come from an [interview](../interview/card.md).
- [agent-code-review](../agent-code-review/card.md) is the same idea, a fresh reviewer, for code.
- Structural checks of `docs/` in CI are [knowledge-base-doc-lint](../knowledge-base-doc-lint/card.md).

## Agent step

The reviewer of the `text-quality` part: it gets the brief and the text and returns findings by its error
catalogue. It is calibrated by that part's own test bench (`en/lab/`), not by the harness; its prompt is
never changed by hand.
