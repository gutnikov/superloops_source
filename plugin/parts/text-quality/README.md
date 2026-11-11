# Text quality

A part of superloops. `/superloops` writes by it the texts a person makes a decision on: the answer of discovery, a
proposal of loops, the description of a merge request. The `document-review` loop checks `LOOP.md` files and agents'
prompts by it.

**A text for a decision** is any text a person later makes a decision on. It can be a short answer in a chat. Such a
text has a higher bar than usual: it holds only checked facts, and it is written so that it is understood one way.

Not a text for a decision: a confirmation ("done", "started"), a link, a status line, a command's output as it is.

The text is written not by the agent but by the language package: a writer, a fact check against the brief, and a
reviewer with a catalogue of errors.

| Language | Package | Status |
|---|---|---|
| English | `en/` (`en/README.md`), built on the US Federal Plain Language Guidelines, GOV.UK and Strunk | Measured in part: on held-out briefs, 58% fewer review findings and 7 times fewer invented facts than with no prompt |

`en/` was carried over from rutalk, an earlier Russian-language package that is not published in this repository.
Where a rule below rests on rutalk's measurements, it says so; for `en/` such a rule is a hypothesis. Another language
is a new package with the same files, the same JSON formats and its own lab (`en/lab/` shows how).

`scripts/talk.py` runs the steps, each as a separate, isolated `claude -p` call, as in the measurements. Your work is
the brief, the questions, sorting the findings and delivering the text.

```bash
S=<this part's folder>/scripts/talk.py       # parts/text-quality of the superloops plugin
R=$(python3 $S new --name <slug>)            # the run's folder is in superloops/.runs/ at the project's root
```

## 0. The brief: `$R/brief.md`

The writer knows only the brief and will not write what is not in it. The fact check checks only that the text did
not go beyond the brief. So the brief answers for the truth: **every fact has a source**.

```markdown
Text: <what it is and where it will appear: an answer in a chat, a question in a thread, a MR description, a file docs/…>

Facts:
- <a fact>. Source: <path:line, a document, a command and its output, the user's words>
- Agent's conclusion: <your recommendation or conclusion>, because <the facts above>.
- Unknown: <what is not known and, if known, who knows it>.

Reader: <who, what they already know>.
What they must do: <understand something / choose an option / approve / answer>.
Format: <markdown in a chat, Slack with *bold*, a file>; <what to keep as is: paths, IDs, code, terms>.
```

- Take facts from the code, documents, commands and the user's words, and check each one before you write it down.
  If you do not remember the source, do not write the fact.
- Write your recommendation or conclusion into the brief explicitly, as "Agent's conclusion", with reasons.
  Otherwise the writer will not write it, and the fact check will flag it as invented.
- Write "Unknown" explicitly: then the writer will not fill the gap with an invention.
- **Numbers go without "about" or "approximately".** The writer's rule removes the word, the estimate becomes an exact
  figure in the text, the fact check flags it as invented, the revision drops the number, and the fact check flags it
  as missing. If there is no exact number, say that it is an estimate and what it comes from: "estimate: $12 a
  variant, which is what it cost on 40 texts", or "unknown".
- Work out the conclusions that follow from the facts (a calculation, a comparison) yourself and put them in the brief
  ready-made; check the arithmetic. A writer left to draw a conclusion draws it inexactly.
- If the text is a question: the options for the answer, what each leads to, and the option "I don't know, <who>
  knows".

## 1. Questions about the brief

```bash
python3 $S check-brief $R               # up to 5 questions → questions.json
```

Answer them yourself first, from the code and documents. Ask the user what you did not find, in one message, and
wait for the answer. Add the answers to the brief, "Author's answers: …", with a source. "Unknown" is an answer too;
add it. If there is no one to ask (automation, a nightly run), write "unknown". An empty list of questions: go
straight to step 2.

## 2. Write

```bash
python3 $S write $R                     # → text.md
```

## 3. Check: the fact check and the review, in parallel

```bash
python3 $S check $R --context "<genre>; reader: <who>; goal: <what they must understand or decide>"
```

`facts.json`: `invented` are claims that are not in the brief; `missing` are facts of the brief without which the
reader cannot do their task. `review.json`: the reviewer's findings with a code, a severity of 1–4 and a place.

## 4. Sort the findings, once

- **A finding needs a fact the brief does not have** (often M-IDEAL: "it does not say what to do if…"). Find the fact
  in the code or ask the user, add it to the brief and go back to step 2. If there is no new fact, write "unknown" in
  the brief and go back to step 2 as well. This return happens once.
- **Everything else is one revision:**
  ```bash
  python3 $S revise $R                  # review 1–2 + invented and missing from the fact check → text.md
  python3 $S check $R --facts-only      # a revision sometimes adds an invention: check the facts again
  ```
  `unresolved` in the revision's answer are facts that are missing: handle them as in the first point.
  Fix findings of severity 3–4 only when the fix is obvious: `revise $R --max-severity 4`.
- If the fact check finds an invention again after the revision, delete that sentence from `text.md` yourself, with
  no new round.
- **There is no second review.** rutalk measured that a second round of review and revision leaves the same number of
  findings and adds inventions. For `en/` this is still a hypothesis, but the rule is the same.

## 5. Deliver

- In a chat: `text.md` as it is. Add no words of your own before or after it, except a service line (the path to the
  file, a link).
- In a file: copy `text.md` to where it belongs.
- If the text has to change after the checks, it is a new text: edit the brief and run the steps again.

## Cost and limits

- `en/`: the review costs $0.54–0.58 a text and the Sonnet writer $0.01; the cost of the fact check was not recorded.
  In rutalk the whole run cost an estimated $0.36 a text, almost all of it the review, and the first review in a
  session, before the cache warmed up, $1.07 on a trial run. The steps that do not wait for answers take an
  estimated two minutes, one and a half of them for the review.
- It needs `claude` (the Claude Code CLI) in PATH and network access.
- The default models are the ones rutalk tested: the writer, the revision and the questions on Opus medium, the fact
  check on Sonnet high, the review on Opus. Every command has `--model` and `--effort`.
- Do not change the prompts in `en/` by hand: a change goes only through the package's lab (`en/lab/`) and its
  measurement.
- Do not ask the writer for markers such as "[to be confirmed]": the reviewer counts the gap anyway, and the text gets
  cluttered. A gap is closed by a fact or by "unknown" in the brief.
