#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""The steps of the text-quality part for one text, run the way <package>/lab/lab.py runs them.

    python3 talk.py new [--lang en] [--name slug]    create a run's folder, print its path
    python3 talk.py check-brief RUN                  brief.md → questions.json: up to 5 questions to the author
    python3 talk.py write RUN                        brief.md → text.md
    python3 talk.py check RUN --context "…"          text.md → facts.json and review.json, in parallel
    python3 talk.py check RUN --facts-only           only the fact check against the brief (after a revision)
    python3 talk.py revise RUN                       one revision: review 1–2 + invented and missing from
                                                     the fact check → text.md (the previous one is text.vN.md)

RUN is a run's folder; the agent writes brief.md in it, and the language is in lang.txt.
The writer, the brief check, the fact check and the revision run isolated: from an empty
folder, with `--safe-mode`, no tools, only their prompt. The reviewer runs from
<package>/review/ with Read and text_scan.py.
"""
import argparse
import concurrent.futures
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from typing import NoReturn

SKILL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def runs_dir():
    """The runs' folder: TEXT_QUALITY_RUNS_DIR (or the older SPEC_RUNS_DIR), else superloops/.runs/ at the root
    of the current folder's git repository, else in the current folder."""
    runs = os.environ.get('TEXT_QUALITY_RUNS_DIR') or os.environ.get('SPEC_RUNS_DIR')
    if runs:
        return os.path.abspath(runs)
    try:
        top = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True,
                             check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        top = ''
    return os.path.join(top or os.getcwd(), 'superloops', '.runs')


RUNS = runs_dir()

# The messages are the ones in each package's lab/lab.py: the measurements were made with them.
# A new language is a new entry here and a package folder with the same files.
LANGS = {
    'en': {
        'dir': os.environ.get('TEXT_QUALITY_EN_DIR') or os.environ.get('SPEC_EN_DIR') or os.path.join(SKILL, 'en'),
        'writer_user': 'Brief:\n{task}\n\nReturn only the finished text in markdown, with no explanations or comments.',
        'brief_user': 'Brief:\n{task}',
        'facts_user': 'BRIEF:\n{task}\n\nTEXT:\n{text}',
        'revise_user': 'Brief:\n{task}\n\nYour text:\n{text}\n\nAn editor reviewed the text and found problems:\n{findings}\n\n',
        'review_user': 'Review the text in the file {path}.\nContext: {context}.\nReturn the report as JSON only.',
        'review_addendum': """

# Run mode

You are working in an automated run.
- The full error catalogue is given below — do not read error-patterns.md again.
- The text to review is in a file; its path is in the message. Read it and run `python3 text_scan.py <file>` from the review/ folder.
- Return the report only as JSON, in the schema from the section "Report format (JSON, on request)", with no markdown and no explanations around it.
""",
        'catalog_heading': '\n\n# Error catalogue (error-patterns.md)\n\n',
        'finding': '%d. %s · %s (severity %s)\n   Where: %s\n   What is wrong: %s',
        'location': '%s — "%s"',
        'invented': ('Fact not in the brief', ' Remove the claim; do not replace it with another fact.'),
        'missing': ('Fact from the brief is missing', 'whole text',
                    'The text lacks a fact from the brief: %s. %s Add it where the reader needs it.'),
    },
}

QUESTIONS_SCHEMA = {'type': 'object', 'required': ['questions'],
                    'properties': {'questions': {'type': 'array', 'items': {'type': 'string'}}}}
CHECK_SCHEMA = {
    'type': 'object', 'required': ['invented', 'missing'],
    'properties': {
        'invented': {'type': 'array', 'items': {'type': 'object', 'required': ['quote', 'why'],
                                                'properties': {'quote': {'type': 'string'}, 'why': {'type': 'string'}}}},
        'missing': {'type': 'array', 'items': {'type': 'object', 'required': ['fact', 'why'],
                                               'properties': {'fact': {'type': 'string'}, 'why': {'type': 'string'}}}},
    },
}
REVISE_SCHEMA = {
    'type': 'object', 'required': ['text', 'unresolved'],
    'properties': {
        'text': {'type': 'string'},
        'unresolved': {'type': 'array', 'items': {'type': 'object', 'required': ['code', 'missing_fact'],
                                                  'properties': {'code': {'type': 'string'},
                                                                 'missing_fact': {'type': 'string'}}}},
    },
}
REPORT_SCHEMA = {
    'type': 'object', 'required': ['findings'],
    'properties': {
        'text': {'type': 'object'},
        'summary': {'type': 'object'},
        'findings': {'type': 'array', 'items': {
            'type': 'object', 'required': ['code', 'severity', 'locations', 'problem'],
            'properties': {
                'rank': {'type': 'integer'}, 'code': {'type': 'string'}, 'title': {'type': 'string'},
                'severity': {'type': 'integer'},
                'locations': {'type': 'array', 'items': {'type': 'object', 'properties': {
                    'ref': {'type': 'string'}, 'quote': {'type': 'string'}}}},
                'problem': {'type': 'string'}, 'chapter': {'type': 'string'},
            }}},
        'doubtful': {'type': 'array'},
    },
}


class Pack:
    """The files of a language package (en/) and its messages."""

    def __init__(self, lang):
        self.lang = lang
        self.cfg = LANGS[lang]
        d = self.cfg['dir']
        self.review = os.path.join(d, 'review')
        self.writer = os.path.join(d, 'writing-a-text.md')
        self.brief = os.path.join(d, 'checking-a-brief.md')
        self.facts = os.path.join(d, 'checking-facts.md')
        self.revise = os.path.join(d, 'revising-a-text.md')
        self.reviewer = os.path.join(self.review, 'reviewer-prompt.md')
        self.catalog = os.path.join(self.review, 'error-patterns.md')
        missing = [p for p in (self.writer, self.brief, self.facts, self.revise, self.reviewer, self.catalog)
                   if not os.path.exists(p)]
        if missing:
            sys.exit('package %s is incomplete, missing: %s' % (lang, ', '.join(missing)))

    def __getitem__(self, key):
        return self.cfg[key]


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read().strip()


def write(path, text):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text if text.endswith('\n') else text + '\n')


def dump(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


def need(path, hint) -> None:
    if not os.path.exists(path):
        sys.exit('no %s: %s' % (path, hint))


def strip_fences(text):
    t = text.strip()
    m = re.match(r'^```(?:markdown|md)?\s*\n(.*)\n```$', t, re.S)
    return (m.group(1) if m else t).strip()


def log_cost(run, step, outer):
    entry = {'step': step, 'at': datetime.datetime.now().isoformat(timespec='seconds'),
             'cost_usd': (outer or {}).get('total_cost_usd'), 'duration_ms': (outer or {}).get('duration_ms')}
    with open(os.path.join(run, 'costs.jsonl'), 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    return entry['cost_usd'] or 0


def claude(args, cwd, timeout, schema=None):
    """One `claude -p` call; returns (structured_output or result, outer)."""
    cmd = ['claude', '-p'] + args + ['--output-format', 'json', '--no-session-persistence']
    if schema:
        cmd += ['--json-schema', json.dumps(schema, ensure_ascii=False)]
    try:
        proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout,
                              stdin=subprocess.DEVNULL)
    except subprocess.TimeoutExpired:
        return None, {'error': 'timeout %ss' % timeout}
    try:
        outer = json.loads(proc.stdout)
    except ValueError:
        return None, {'error': (proc.stderr or proc.stdout)[-1500:]}
    if outer.get('is_error'):
        return None, outer
    return (outer.get('structured_output') if schema else outer.get('result')), outer


def isolated(prompt, user, model, effort, timeout, schema=None):
    """The writer, the brief check, the fact check, the revision: an empty folder, safe mode, no tools."""
    sandbox = tempfile.mkdtemp(prefix='talk-')
    try:
        return claude([user, '--safe-mode', '--tools', '', '--model', model, '--effort', effort,
                       '--system-prompt', prompt], sandbox, timeout, schema)
    finally:
        shutil.rmtree(sandbox, ignore_errors=True)


def fail(step, outer) -> NoReturn:
    sys.exit('%s: error: %s' % (step, (outer or {}).get('error') or (outer or {}).get('result') or outer))


# ---------------------------------------------------------------- commands

def cmd_new(a):
    os.makedirs(RUNS, exist_ok=True)
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    prefix = '%s-%s-%s-' % (stamp, a.lang, a.name) if a.name else '%s-%s-' % (stamp, a.lang)
    run = tempfile.mkdtemp(prefix=prefix, dir=RUNS)
    write(os.path.join(run, 'lang.txt'), a.lang)
    print(run)


def cmd_check_brief(a, pk):
    brief = os.path.join(a.run, 'brief.md')
    need(brief, 'write the brief first')
    out, outer = isolated(read(pk.brief), pk['brief_user'].format(task=read(brief)), a.model, a.effort,
                          a.timeout, QUESTIONS_SCHEMA)
    if out is None:
        fail('check-brief', outer)
    dump(os.path.join(a.run, 'questions.json'), out)
    cost = log_cost(a.run, 'check-brief', outer)
    qs = out.get('questions') or []
    print('Questions to the author: %d ($%.3f)' % (len(qs), cost))
    for n, q in enumerate(qs, 1):
        print('%d. %s' % (n, q))


def cmd_write(a, pk):
    brief = os.path.join(a.run, 'brief.md')
    need(brief, 'write the brief first')
    text, outer = isolated(read(pk.writer), pk['writer_user'].format(task=read(brief)),
                           a.model, a.effort, a.timeout)
    if not text:
        fail('write', outer)
    write(os.path.join(a.run, 'text.md'), strip_fences(text))
    cost = log_cost(a.run, 'write', outer)
    print('text.md: %d chars ($%.3f): %s' % (len(text), cost, os.path.join(a.run, 'text.md')))


def run_facts(a, pk):
    return isolated(read(pk.facts),
                    pk['facts_user'].format(task=read(os.path.join(a.run, 'brief.md')),
                                            text=read(os.path.join(a.run, 'text.md'))),
                    a.facts_model, 'high', a.timeout, CHECK_SCHEMA)


def review_consistent(report):
    """The summary agrees with the list of findings; otherwise the model slipped while generating the JSON (as in lab.py)."""
    summary = report.get('summary') or {}
    n = len(report.get('findings') or [])
    if isinstance(summary.get('total'), int) and summary['total'] != n:
        return False
    try:
        by_sev = sum(int(v) for v in (summary.get('by_severity') or {}).values())
    except (TypeError, ValueError):
        return True
    return not summary.get('by_severity') or by_sev == n


def run_review(a, pk, context):
    system = read(pk.reviewer) + pk['review_addendum'] + pk['catalog_heading'] + read(pk.catalog)
    user = pk['review_user'].format(path=os.path.join(a.run, 'text.md'), context=context)
    args = [user, '--append-system-prompt', system, '--allowedTools', 'Read', 'Bash(python3 text_scan.py:*)',
            '--add-dir', a.run, '--model', a.review_model]
    out, outer = claude(args, pk.review, a.timeout, REPORT_SCHEMA)
    if out is None or not review_consistent(out):
        out, outer = claude(args, pk.review, a.timeout, REPORT_SCHEMA)
    return out, outer


def cmd_check(a, pk):
    need(os.path.join(a.run, 'text.md'), 'run write first')
    ctx_path = os.path.join(a.run, 'context.txt')
    if a.context:
        write(ctx_path, a.context)
    if not a.facts_only and not os.path.exists(ctx_path):
        sys.exit('--context is required: "<genre>; reader: <who>; goal: <what they must understand or decide>"')
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        facts = pool.submit(run_facts, a, pk)
        review = None if a.facts_only else pool.submit(run_review, a, pk, read(ctx_path))
        facts_out, facts_outer = facts.result()
        review_out, review_outer = review.result() if review else (None, None)

    if facts_out is None:
        fail('check-facts', facts_outer)
    dump(os.path.join(a.run, 'facts.json'), facts_out)
    cost = log_cost(a.run, 'check-facts', facts_outer)
    print('## Fact check against the brief ($%.3f)' % cost)
    print('Invented: %d' % len(facts_out['invented']))
    for f in facts_out['invented']:
        print('- "%s": %s' % (f['quote'], f['why']))
    print('Missing: %d' % len(facts_out['missing']))
    for f in facts_out['missing']:
        print('- %s: %s' % (f['fact'], f['why']))

    if a.facts_only:
        return
    if review_out is None:
        fail('review', review_outer)
    dump(os.path.join(a.run, 'review.json'), review_out)
    cost = log_cost(a.run, 'review', review_outer)
    findings = sorted(review_out.get('findings') or [], key=lambda f: f.get('severity') or 9)
    print('\n## Review ($%.3f)' % cost)
    print('Findings: %d' % len(findings))
    for f in findings:
        where = '; '.join('%s "%s"' % (l.get('ref', ''), l.get('quote', '')) for l in f.get('locations') or [])
        print('- [%s] %s %s: %s\n  %s' % (f.get('severity'), f.get('code'), f.get('title', ''), where,
                                          f.get('problem', '')))


def format_findings(pk, findings):
    out = []
    for n, f in enumerate(findings, 1):
        where = '; '.join(pk['location'] % (l.get('ref', ''), l.get('quote', '')) for l in f.get('locations') or [])
        out.append(pk['finding'] % (n, f.get('code', ''), f.get('title', ''), f.get('severity', ''), where,
                                    f.get('problem', '')))
    return '\n'.join(out)


def cmd_revise(a, pk):
    review_path = os.path.join(a.run, 'review.json')
    need(review_path, 'run check first')
    findings = [f for f in json.load(open(review_path, encoding='utf-8')).get('findings') or []
                if (f.get('severity') or 9) <= a.max_severity]
    # The fact check's findings go into the revision too (lab/lab.py does not do this; it is added here):
    # remove what is invented, bring back what is missing.
    facts_path = os.path.join(a.run, 'facts.json')
    if a.with_facts and os.path.exists(facts_path):
        facts = json.load(open(facts_path, encoding='utf-8'))
        inv_title, inv_tail = pk['invented']
        miss_title, miss_ref, miss_problem = pk['missing']
        for inv in facts.get('invented') or []:
            findings.append({'code': 'FACT-INVENTED', 'title': inv_title, 'severity': 1,
                             'locations': [{'ref': '', 'quote': inv['quote']}],
                             'problem': inv['why'] + inv_tail})
        for miss in facts.get('missing') or []:
            findings.append({'code': 'FACT-MISSING', 'title': miss_title, 'severity': 1,
                             'locations': [{'ref': miss_ref, 'quote': ''}],
                             'problem': miss_problem % (miss['fact'], miss['why'])})
    if not findings:
        print('Nothing to revise: no findings of severity 1–%d and no differences from the brief.' % a.max_severity)
        return
    text_path = os.path.join(a.run, 'text.md')
    user = pk['revise_user'].format(task=read(os.path.join(a.run, 'brief.md')), text=read(text_path),
                                    findings=format_findings(pk, findings)) + read(pk.revise)
    out, outer = isolated(read(pk.writer), user, a.model, a.effort, a.timeout, REVISE_SCHEMA)
    if out is None:
        fail('revise', outer)
    n = 1
    while os.path.exists(os.path.join(a.run, 'text.v%d.md' % n)):
        n += 1
    shutil.copy(text_path, os.path.join(a.run, 'text.v%d.md' % n))
    write(text_path, strip_fences(out['text']))
    dump(os.path.join(a.run, 'revision.json'), {'findings': findings, 'unresolved': out['unresolved']})
    cost = log_cost(a.run, 'revise', outer)
    print('Revised for %d findings ($%.3f); the previous text is text.v%d.md' % (len(findings), cost, n))
    print('Cannot be closed without new facts: %d' % len(out['unresolved']))
    for u in out['unresolved']:
        print('- %s: %s' % (u['code'], u['missing_fact']))


def main():
    if not shutil.which('claude'):
        sys.exit('the Claude Code CLI (`claude`) must be in PATH')
    ap = argparse.ArgumentParser(description='The steps of the text-quality part for one text')
    sub = ap.add_subparsers(dest='cmd', required=True)

    p = sub.add_parser('new')
    p.add_argument('--lang', default='en', choices=sorted(LANGS), help="the text's language: en → the en/ package")
    p.add_argument('--name', default='')
    p.set_defaults(fn=cmd_new)

    def run_parser(name, fn, model='opus', effort='medium', timeout=300):
        p = sub.add_parser(name)
        p.add_argument('run')
        p.add_argument('--model', default=model)
        p.add_argument('--effort', default=effort)
        p.add_argument('--timeout', type=int, default=timeout)
        p.set_defaults(fn=fn)
        return p

    run_parser('check-brief', cmd_check_brief)
    run_parser('write', cmd_write)
    p = run_parser('check', cmd_check, timeout=900)
    p.add_argument('--context', help='"<genre>; reader: <who>; goal: <what they must understand or decide>"')
    p.add_argument('--facts-only', action='store_true')
    p.add_argument('--facts-model', default='sonnet')
    p.add_argument('--review-model', default='opus')
    p = run_parser('revise', cmd_revise)
    p.add_argument('--max-severity', type=int, default=2)
    p.add_argument('--no-facts', dest='with_facts', action='store_false',
                   help='do not take the invented and missing facts from facts.json into the revision')

    a = ap.parse_args()
    if a.cmd == 'new':
        return a.fn(a)
    a.run = os.path.abspath(a.run)
    if not os.path.isdir(a.run):
        sys.exit('no run folder %s: create it with talk.py new' % a.run)
    lang_path = os.path.join(a.run, 'lang.txt')
    lang = read(lang_path) if os.path.exists(lang_path) else 'en'
    if lang not in LANGS:
        sys.exit('unknown language in %s: %s' % (lang_path, lang))
    a.fn(a, Pack(lang))


if __name__ == '__main__':
    main()
