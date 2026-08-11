---
name: implement-spec
description: Runs a spec to completion without mid-run questions — each step mined for the existing pattern, gated green, committed before the next begins. Use it to implement from docs/specs/<id>.md, or when asked to build something unattended. Decisions go to the ledger rather than to the human.
---

# Implement spec

The implementation loop. Everything that makes it unattended lives in the preconditions and the gates — the coding itself is the ordinary part.

## Preconditions

Check all four before the first edit. A missing one is a stop condition, because starting without it guarantees the interruption you are trying to avoid:

1. **The spec** exists at `docs/specs/<id>.md` with steps that carry verify commands. Thin spec → run `spec-forge` first.
2. **The map** at `docs/agent/repo-map.md` is current, so the workspace kind, the stack per project, the gate commands and the changed-set command are known. Missing or stale → `repo-cartograph`.
3. **The contract** is confirmed for every endpoint the spec touches — `api-contract-sync`. Implementing against an assumed shape wastes the whole run.
4. **The ledger** exists at `docs/specs/<id>.assumptions.md`, even if empty.

Read `agentic-guardrails` before starting. It carries the ledger format, the repair budget, and the shortcut list.

Branch from the base branch named in the map. Work on a branch, always — an unattended run needs somewhere to roll back to.

Then declare the run at `.agent/current-run.json`, so the guardrail hooks can enforce the blast radius rather than trusting you to respect it:

```json
{ "id": "<spec id>", "spec": "docs/specs/<id>.md", "allow": [<the spec's allowed paths>], "status": "running" }
```

Set `status` to `stopped` when parking the run deliberately, and to `handed-over` once `pr-package` has produced the handover. Where `guardrail-hooks` is not installed in this repo, the file costs nothing and the enforcement is yours alone.

## The step loop

For each step in the spec, in order:

**Mine.** Run `pattern-mine` for the thing this step creates. The existing pattern outranks framework idiom and outranks your own preference.

**Scaffold before writing.** When the repo has a generator for what you are creating, use it — a workspace generator, a framework CLI, a `plop`/`hygen` template, a documented copy-this-folder convention. Check what exists: `nx list`, `ng generate --help`, a `generators/` or `tools/` directory, a `plopfile`. Generators produce the file layout, test scaffold, barrel export and project wiring that hand-written files forget, and workspace-local ones encode team conventions no amount of reading reproduces. Adjust the output afterwards; start from it. Where none exists, copy the closest neighbour `pattern-mine` found and adapt.

**Respect the boundaries.** The map's **Boundaries** section says what this project may import. Check before adding an import rather than discovering it at lint. An import the rules forbid means the code is in the wrong project — move the code; the rules are not the thing to edit. Where the map says boundaries are convention only, nothing will catch a violation, so the check is entirely yours.

**Implement the step, and only the step.** The blast radius in the spec is the boundary. Adjacent improvements you notice go into a `## Noticed` list in the handover, not into this diff. A diff that fixes three unrelated things is a diff nobody can review.

**Decide and record.** Every fork you meet: pick, write the ledger entry with its reason, continue. Consult `agentic-guardrails` for the four cases that stop the run instead.

**Gate.** Run `green-gate` on the changed set. The step is not done until its own verify command from the spec passes, plus typecheck, lint and unit tests.

**Commit.** One commit per green step, message naming the step and the spec id. This is the rollback point the repair budget depends on; a run without per-step commits has nothing to revert to but the branch point.

## After the last step

In this order — each one finds defects the previous cannot:

1. **`green-gate`, full run** — every gate on the complete changed set against the base branch. Compare the changed set against the spec's expected set and report any mismatch.
2. **`visual-verify`** — every state from the acceptance criteria, in a real browser, with console and network read.
3. **`self-review`** — the diff against the spec and against the repo's conventions.
4. **`pr-package`** — evidence, ledger and screenshots into a handover a human can review in minutes. Then set `status` in `.agent/current-run.json` to `handed-over`.

## When it goes wrong

The repair budget in `agentic-guardrails` governs: three attempts per failing gate, hypothesis stated before each, then revert to the last green commit and write the failure report.

A failure report names the step that failed, the gate, the three hypotheses and what each attempt showed, plus the steps that did land green. Partial completion with an accurate boundary is a useful result; the branch stays, and the human resumes from a known state.

## Done when

Every spec step is implemented and committed green, the full gate run passes, every acceptance criterion has evidence — a test, a screenshot, or an explicit unverified entry — the ledger accounts for every decision taken, the changed set matches the blast radius, and `pr-package` has produced the handover.
