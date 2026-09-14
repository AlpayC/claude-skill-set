# Claude Skill Set — Agentic Coding with Guardrails

[![check](https://github.com/AlpayC/claude-skill-set/actions/workflows/check.yml/badge.svg)](https://github.com/AlpayC/claude-skill-set/actions/workflows/check.yml)

A set of 35 skills for Claude Code, built for agentic work in enterprise codebases: the agent should be able to take a ticket end to end without asking a question mid-implementation.

## The guiding principle

Autonomy does not come from better implementation prompts. It comes from moving the human decision out of the middle and onto the edges:

```
BEFORE (human decides)      →  DURING (agent alone)        →  AFTER (human reviews)
Spec, acceptance criteria,     Ledger instead of question,    Evidence package,
context, blast radius          gate instead of claim          self-review, PR
```

Every question asked during implementation has one of two causes: missing context, where the agent does not know how you do things, or an undecided spec, where the question was already open beforehand. Each skill pays into one of the two.

Three primitives carry it:

- **Assumption ledger** — instead of asking, the agent decides, writes decision, alternative, reasoning and reversal cost to `docs/specs/<id>.assumptions.md`, and keeps working. The human checks the list at review time.
- **Repair budget** — three repair attempts per red gate, each with a hypothesis stated up front. After that: revert, and a precise failure report rather than more flailing.
- **Evidence** — "it works" is a claim, and every claim needs its proof (exit code, screenshot). Without proof it is reported as *unverified*.

All three live in one place, `agentic-guardrails`, and every other skill references them by name.

Four of these rules are also installable as hooks (`guardrail-hooks`), which enforces them instead of requesting them. Prose in the context window is a suggestion, and adherence to it drops as a session gets longer — which is the condition unattended work creates.

## Self-contained

The set has no dependency on other skill plugins. Every skill references only skills from this repo, and the shared rules live exclusively in `agentic-guardrails`. Nothing here depends on a plugin that can change underneath you.

## Repo-agnostic

The skills assume no particular repo structure. `repo-cartograph` detects the workspace kind — NX, Turborepo, pnpm/npm/yarn workspaces, Lerna, Rush, single package, polyrepo, Maven/Gradle/.NET/Go/Cargo — and writes enumeration, dependency graph, gate commands, boundary mechanism and changed-set command to `docs/agent/repo-map.md`. Every other skill reads that instead of guessing commands. For repos without affected-tooling there is a fallback ladder: `git diff`, then manifest mapping, then dependents, then everything when a root config changed.

With several repos (frontend + backend) each gets its own map. The connection between them sits under **Seams** and is used by `api-contract-sync` and `feature-trace`.

## The chain

```
repo-cartograph ─┐
context-baseline ├─→ spec-forge ─→ implement-spec ─→ green-gate ─→ visual-verify ─→ self-review ─→ pr-package
api-contract-sync┤      ↑ grill-spec        ↑ pattern-mine
domain-glossary ─┘      ↑ ui-spec           ↑ tdd-frontend
```

Nothing in the chain asks the human a question. Decisions go to the ledger, and only the four stop conditions in `agentic-guardrails` end a run early.

## The skills

**Foundation** — `repo-cartograph` · `context-baseline` · `api-contract-sync` · `domain-glossary`
**Before implementing** — `epic-map` · `spec-forge` · `grill-spec` · `ui-spec`
**While implementing** — `implement-spec` · `agentic-guardrails` · `guardrail-hooks` · `green-gate` · `visual-verify` · `pattern-mine` · `tdd-frontend` · `bug-hunt` · `refactor-safe` · `dep-upgrade`
**After** — `self-review` · `pr-package` · `review-run` · `adr-capture` · `session-handoff`
**Knowledge** — `explain-like-im-new` · `feature-trace` · `arc42-sync` · `dev-wiki` · `runbook`
**CI/CD** — `pipeline-doctor` · `flaky-triage` · `ci-authoring` · `perf-budget`
**Meta** — `autonomy-postmortem` · `skill-forge` · `skills-map`

`/skills-map` has the full table: every skill with the situation it applies to.

## Installation

```powershell
.\install.ps1            # junctions into ~\.claude\skills (edits take effect immediately)
.\install.ps1 -Copy      # copy instead
.\install.ps1 -Scope project -Target C:\path\to\repo   # for one repo only
```

Claude Code loads the skills at its next start.

The skills and the three reviewer agents come with `install.ps1`. Hooks and permissions are installed per target repo, because they check that repo's blast radius and evidence:

```bash
node hooks/install-hooks.mjs C:\path\to\repo --permissions   # hooks + allowlist
node hooks/install-hooks.mjs C:\path\to\repo --local         # personal, settings.local.json
node hooks/install-hooks.mjs C:\path\to\repo --dry-run       # show only
```

`--permissions` merges in the allowlist from `settings/permissions.json`, which lets an unattended run get through without bypassing permissions entirely. The reasoning, and what is deliberately left out of it, is in `settings/README.md`.

The installer merges into existing settings, is idempotent, and adds `.agent/` to the `.gitignore`. Open `/hooks` once afterwards, or restart: the settings watcher only follows directories that already had a settings file when the session started.

## Where to start

1. `repo-cartograph` in the frontend repo, then in the backend repo. Everything else reads the map.
2. `context-baseline` — a root `CLAUDE.md` plus one file per app that deviates from it.
3. `api-contract-sync` — set up once, so the API shape is never guessed.
4. Then run a real, small ticket through `spec-forge` → `implement-spec`.
5. After every interruption, `autonomy-postmortem`.

Step 5 is the important one. Without it the set stays as autonomous as it was on installation day; with it, every interruption permanently removes a whole class of interruptions.

## Artefacts the skills create

| Path | From | Contents |
|---|---|---|
| `docs/agent/repo-map.md` | `repo-cartograph` | Workspace kind, projects, stacks, gates, boundaries, seams |
| `docs/agent/glossary.md` | `domain-glossary` | Domain term → code identifier, with aliases |
| `docs/agent/wiki/` | `dev-wiki` | Answered questions with file-level proof |
| `docs/agent/autonomy-log.md` | `autonomy-postmortem` | One line per interruption — the trend |
| `docs/agent/perf-baseline.md` | `perf-budget` | Measured baseline with commit and conditions |
| `docs/epics/<id>.md` | `epic-map` | Slices, open decisions, what was learned |
| `docs/specs/<id>.md` | `spec-forge` | The spec the run executes against |
| `docs/specs/<id>.assumptions.md` | every implementation skill | The ledger |
| `.agent/current-run.json` | `implement-spec` | The active run — hooks read blast radius and status from it |
| `.agent/handoff/` | `session-handoff` | Handover notes, chronological |
| `docs/adr/NNNN-*.md` | `adr-capture` | Architecture decisions (arc42 ch. 9 indexes them) |
| `docs/architecture/` | `arc42-sync` | arc42 document, one file per chapter |
| `.agent/evidence/<id>/` | `green-gate`, `visual-verify`, `bug-hunt` | Gate output, screenshots, console/network, repro command, ranked hypotheses |

`.agent/` belongs in `.gitignore`; `docs/` is committed.

## The morning review

Two separate surfaces, on purpose.

`node tools/evidence-board.mjs <repo>` gives you the overview. It produces `.agent/board.html`: every run in four columns (spec ready, running, needs review, blocked), gaps marked yellow, screenshots embedded. One file, no server, gitignored because it contains internal screenshots.

`review-run` is where you intervene. It walks you through a run in the conversation: decisions first with a recommendation, screenshots rendered inline, gaps phrased as questions. You answer in the same place and the agent acts on it immediately.

The board tells you where to look. The intervention happens in chat, so an objection costs a sentence instead of copying and switching windows.

## Parallelism

One rule: **parallelise reading, serialise writing.** Two agents in one working tree destroy each other's work.

These skills fan out to subagents: `repo-cartograph` (stack detection per project), `pattern-mine` (the three examples), `feature-trace` (frontend and backend path), `epic-map` (one lookup per open decision), `green-gate` (the final run across independent projects) and `self-review` (three axes in fresh context).

Deliberately serial: the `green-gate` step loop, where cheapest first is the whole point, and `bug-hunt` phase 4, where several hypotheses at once means several variables at once.

For two tickets in parallel, use two git worktrees, each with its own branch, its own `.agent/current-run.json`, its own blast radius. Details in `/skills-map`.

## Context load

Eleven skills fire on their own. They are the ones a chain must reach without a human:

`agentic-guardrails` · `repo-cartograph` · `api-contract-sync` · `spec-forge` · `grill-spec` · `pattern-mine` · `implement-spec` · `green-gate` · `visual-verify` · `self-review` · `pr-package`

The other twenty-four are set to `user-invocable-only` through `skillOverrides` in `settings.json`. Nothing is deleted: `/its-name` still works and the content is unchanged, but the skill costs no context and competes for no trigger. That is deliberate. A flaky test, a red pipeline, a design to build are situations you recognise, and recognising them is the judgement a person is there for.

The split has a cost. A hand-invoked skill cannot be reached by another skill, so where a skill says "hand it to `flaky-triage`", the run reports the finding instead of acting on it.

The numbers, from `node tools/check.mjs`:

| | Descriptions in context | Per turn |
|---|---|---|
| The firing eleven | 3,166 chars | ≈ 790 tokens |
| All thirty-five | 9,271 chars | ≈ 2,320 tokens |

`skillListingBudgetFraction` (default 1 % of the window) truncates automatically when the whole skill listing, including every other installed plugin, goes above it.

Promote a skill into the firing core once you have typed its name two or three times. `skill-forge` carries the rule so the core does not grow back by accident.

## What else is in the repo

| Path | For |
|---|---|
| `hooks/` | Four Node hooks that enforce four guardrail rules instead of requesting them |
| `agents/` | The three reviewers `self-review` dispatches in fresh context — without editing tools |
| `settings/` | Permissions allowlist plus the reasoning for what is in it and what is not |
| `tools/evidence-board.mjs` | The review board across all runs |
| `tools/check.mjs` | Checks the skill set itself — before a commit and in CI |

`node tools/check.mjs` reports errors, meaning the skill will not load, and warnings, meaning it loads but probably will not fire. The warning "leads with the artefact" catches the mistake that kept `repo-cartograph` from firing in a real repo.

## Customising

The skills are process, not configuration, and they are meant to be read and changed. `skill-forge` describes the house style: named failure mode up front, checkable `## Done when` criteria, positive phrasing instead of prohibitions, one source of truth per rule, commands taken from the environment instead of hardcoded.

The workflow for changes is in [CONTRIBUTING.md](.github/CONTRIBUTING.md). Run `node tools/check.mjs` before committing; CI runs it again on every push and pull request.
