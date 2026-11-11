---
# What only the user decides about superloops in this project. The first /superloops proposes these from what it found
# and the user's answers; after that they change only with the user's approval (H7). The scripts read the fields
# here; every task reads the whole file.
#
# What the project ships, one or more of: web, api, mobile, library, data, llm, infra.
kind: [library, llm, web]
# How far superloops goes on its own: ask, branch, merge or deploy (the harness part's README, "Preferences").
autonomy: deploy
# Where a change counts as done, and the super-loops end: local, ci, staging or production.
done_at: production
# What the agent can use from its own session, each checked with one real call or named by the user.
# Keys: ci, logs, errors, metrics, traces, browser, deploy, tracker. Value: what and how, e.g. "GitLab CI via glab".
tools:
  ci: "GitHub via gh: gutnikov/superloops, its pull requests and issues; no workflows yet"
  tracker: "GitHub issues of gutnikov/superloops via gh"
  browser: "agent-browser 0.20.14; Playwright's Chromium headless shell"
  deploy: "Cloudflare via wrangler 4.86.0 (npx), the owner's OAuth login: workers, pages, zone read; zone superloops.dev active (checked 2026-11-11)"
# The spend limit in USD for evals and inferential loops; null means no limit.
budget_usd: null
# The spec, once it is set up (the spec part): who answers questions about requirements and approves the spec,
# such as "the user", a name, or "the ticket's reporter"; a person always approves (H5).
spec_approver: "the user"
# Who turns the spec into tests: "agent", a test writer with a fresh context, or a person, such as "QA".
test_writer: agent
# What superloops never invents, whatever the sources hint at: each is a question to the spec approver.
never_invent:
  - prices, credits, quotas and limits
  - who may do what (roles and permissions)
  - legal, compliance and consent texts
  - the wording of errors and of anything about money
  - deadlines, timeouts and retry counts
---

# superloops

The owner's words, from the session of 2026-11-11: one open-source repository with two purposes.

- A plugin for coding agents, as it is now: `plugin/`.
- A website on superloops.dev about the different types of agent loops. On it: a UI constructor of the prompt for a
  new project, and examples of using the different types of loops, for SEO.

It is open source, so anyone can come and propose changes to the repository.

## Notes

- The site itself is built by superloops' principles: it is a product task of this repository, run through its
  super-loops like any other.
- The site's stack: Astro, Cloudflare, Base UI.
- Never copy a copyrighted text into the repository. A third-party source is public domain or under an open licence,
  with the licence stated next to it. The plugin keeps only its English text-quality package for this reason.
- Commits are authored as `Alex <alx.gutnikov@gmail.com>`, never with a work address. It is the owner's pet project.
- Changes to `plugin/`, `.claude-plugin/` and `.github/` need the owner's review (CODEOWNERS on a protected `main`);
  the owner, as an admin, may bypass it.
- To confirm: Cloudflare analytics and Search Console were named in the setup; each goes into `tools` once the
  agent has reached it with one real call. Cloudflare deploys were reached on 2026-11-11.
