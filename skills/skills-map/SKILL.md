---
name: skills-map
disable-model-invocation: true
description: Index of this skill set — which skill to reach for, and the order they chain in.
---

# Skills map

The set is built around one idea: **the human's judgement moves out of the implementation and to its edges.** Before, they write the spec. During, the agent decides and records. After, they review evidence.

Everything here serves one of those three phases, or the context that makes them possible.

## The main chain

```
repo-cartograph ─┐
context-baseline ├─→ spec-forge ─→ implement-spec ─→ green-gate ─→ visual-verify ─→ self-review ─→ pr-package
api-contract-sync┤      ↑ grill-spec        ↑ pattern-mine
domain-glossary ─┘      ↑ ui-spec           ↑ tdd-frontend
```

Nothing in the chain asks the human a question. Decisions go to the ledger in `agentic-guardrails`; only its four stop conditions end a run early.

## Foundation — build these first

| Skill | Reach for it when |
|---|---|
| `repo-cartograph` | The repo has no map, or the map is stale. Everything downstream reads it. |
| `context-baseline` | The repo has no `CLAUDE.md`, or a run failed on an undocumented convention |
| `api-contract-sync` | Before touching an endpoint; when a request fails on shape; when the backend moved |
| `domain-glossary` | A ticket's vocabulary does not match the code's |

## Before implementing

| Skill | Reach for it when |
|---|---|
| `epic-map` | The work is larger than one spec or one session. Cuts it into slices that each become a spec. |
| `spec-forge` | Anything larger than one commit. The contract the run executes. |
| `grill-spec` | A spec or an architecture idea needs stress-testing rather than agreeing with |
| `ui-spec` | Building from a design, and the mockup shows one state of many |

## While implementing

| Skill | Reach for it when |
|---|---|
| `implement-spec` | Running a spec to completion unattended |
| `agentic-guardrails` | Reference for the ledger, repair budget and stop conditions. Read by everything above. |
| `guardrail-hooks` | Installing the hooks that make four of those rules mechanical rather than advisory |
| `green-gate` | After every step, and before every handover |
| `visual-verify` | Any user-visible change — this is what replaces the human glancing at the screen |
| `pattern-mine` | Before creating anything, to find how this repo already does it |
| `tdd-frontend` | The behaviour is specifiable before it is built |
| `bug-hunt` | A defect, an error, a regression |
| `refactor-safe` | Structure changes, behaviour does not |
| `dep-upgrade` | A framework major, an advisory, a large bump |

## After implementing

| Skill | Reach for it when |
|---|---|
| `self-review` | Before a human sees the diff |
| `pr-package` | Assembling the handover the reviewer actually reads |
| `adr-capture` | A decision was made that constrains future work |
| `session-handoff` | Context is running out, or work is being stopped or handed to someone else |

## Knowledge

| Skill | Reach for it when |
|---|---|
| `explain-like-im-new` | Onboarding to an unfamiliar app, at three zoom levels |
| `feature-trace` | Following one feature across both repos, click to database |
| `arc42-sync` | arc42 architecture doc — generated chapters from the code, plus a drift check |
| `dev-wiki` | A question asked twice, answered once and written back |
| `runbook` | Starting, debugging or reaching a state in a project |

## CI/CD

| Skill | Reach for it when |
|---|---|
| `pipeline-doctor` | A pipeline is red, or it passes locally and fails in CI |
| `flaky-triage` | A test passes and fails on the same code |
| `ci-authoring` | Adding or speeding up a pipeline job |
| `perf-budget` | A bundle grew, or the next regression should be caught automatically |

## Meta

| Skill | Reach for it when |
|---|---|
| `autonomy-postmortem` | A run needed a human mid-implementation. Run it every time — this is the flywheel. |
| `skill-forge` | Writing, revising or pruning these skills |

## Working in parallel

One rule decides everything here: **parallelise reading, serialise writing.**

Reading fans out safely because nothing collides. Writing does not — two agents in one working tree produce half-written files, a diff nobody can attribute, and a gate that cannot say whose change it just failed.

**Subagents, for reading and for judgement that must not see your reasoning:**

| Skill | What runs in parallel |
|---|---|
| `repo-cartograph` | Stack detection per project — one agent per project past about five |
| `pattern-mine` | The three examples, identical briefs, conclusions returned |
| `feature-trace` | Frontend path and backend path, joined at the URL |
| `epic-map` | One lookup per open decision, all at once |
| `green-gate` | The final run across independent projects — the step loop stays serial |
| `self-review` | Three axes in fresh context, so the reviewer never sees why the code was written that way |

`self-review` is the one that matters most. An agent reviewing its own diff in its own context reads its intention rather than the code; a fresh context has only what a human reviewer would have.

**Worktrees, for writing.** Two tickets at once means two branches in two directories, never two agents in one checkout. Each gets its own `.agent/current-run.json`, its own blast radius, its own gates. They meet at merge, where git is built to handle it.

**What stays serial on purpose:** the `green-gate` step loop, because cheapest-first is what makes a failure cheap. And `bug-hunt` phase 4 — testing several hypotheses at once changes several variables at once, and then nothing explains what fixed it.

Fan-out costs tokens. For `repo-cartograph`, run once per repo, it pays for itself immediately. For `pattern-mine` on every step, judge it by how large the examples are.

## The one habit that matters

Run `autonomy-postmortem` after every interruption. Answering the question unblocks one run; landing the fix removes that interruption for good. Without it the set stays as autonomous as the day it was installed.
