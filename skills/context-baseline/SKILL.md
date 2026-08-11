---
name: context-baseline
description: Creates and maintains the CLAUDE.md hierarchy — root plus one per project that deviates — carrying the conventions, reasons and gotchas an agent cannot find by reading config. Run it when a repo has no agent context, or when a run failed on an undocumented convention.
---

# Context baseline

Most mid-implementation questions are a missing line in `CLAUDE.md`. This skill converts what the team knows into what the agent reads on every run.

The hierarchy matters wherever a repo holds more than one deliverable: there are repo-wide truths and per-project truths, and mixing them produces a root file so long that neither gets read. Root holds what is true everywhere. Each project's file holds what is true only there. A single-package repo needs one file — the hierarchy is a response to divergence, not a requirement.

## What belongs in these files

The test for every line: **would the agent get this wrong by default, and can it not find the answer by looking?**

Write down what the environment does not confess:

- **Unwritten conventions** — "container components own data fetching, presentational ones take inputs only". No config states this; every reviewer expects it.
- **Reasons behind choices** — "we use the facade pattern over direct store access because the store shape is migrating". Prevents an agent from "simplifying" a deliberate indirection.
- **Gotchas** — "the dev server needs the mock backend on :4010 first, otherwise the login guard loops". Costs an hour to rediscover, one line to record.
- **Local deviations** — "this app still uses the old form library; do not port it opportunistically".
- **Hard boundaries** — what must never be touched without a human: generated files, vendored code, anything under a `legacy/` path.

Leave out what a lookup answers: the script list from `package.json`, the dependency versions, the directory layout. A restated lookup goes stale and buys nothing; point at the file instead.

Leave out the project inventory too — that is `docs/agent/repo-map.md`, maintained by `repo-cartograph`. The root file points at it in one line.

## 1 — Mine what exists

Sources of unwritten convention, in order of signal strength:

1. **Review comments in merged PRs** — `gh pr list --state merged --limit 40` then read the review threads. Repeated comments are exactly the conventions worth writing down; a rule a human states three times is a rule the agent should have read once.
2. **Existing docs** — README, wiki exports, onboarding pages. Extract the still-true parts and note what looks stale rather than copying it wholesale.
3. **The code's own consistency** — where twenty files agree and two disagree, the twenty are the convention. Where the split is even, there is no convention yet; record that as an open question instead of inventing one.
4. **Lint and CI config** — rules that are configured but not enforced (warnings) are conventions in transition, worth a line explaining the direction.

## 2 — Write the root file

`CLAUDE.md` at the repo root, aimed at ~100 lines:

```markdown
# <Repo>

Repo map (projects, stacks, gates): docs/agent/repo-map.md
Domain glossary: docs/agent/glossary.md

## Working agreements
<Conventions true across every project here>

## Boundaries
<What must never be changed without a human>

## Cross-repo
<Where the other repo lives, how the contract is kept in sync>

## Gotchas
<The things that cost an hour to rediscover>
```

## 3 — Write the per-project files

`<project>/CLAUDE.md`, aimed at ~40 lines each, and only for projects that actually deviate. Carry only what differs from root: local patterns, deviations, its own gotchas. A file that repeats root has made root's rules look twice as important as they are, and a file that says nothing new is pure context load.

## 4 — Verify by running

An unverified context file is a guess. Pick a small real task in one app, run it against the new context, and watch for the two failure signatures:

- The agent **asked a question** the file should have answered → the answer was missing or too vague. Add it.
- The agent **followed a rule that produced the wrong result** → the rule was overstated or stale. Correct it.

## Done when

Root and per-app files exist, every line passes the "would get this wrong by default and cannot look it up" test, and one real task has been run end to end against them with its two failure signatures checked.

## Maintenance

This file grows by sediment unless it is pruned. Every entry added by `autonomy-postmortem` earns its place by naming the run that needed it. When a convention becomes enforced by lint, delete its line — the check now carries the meaning, and the prose is a duplicate that will drift.
