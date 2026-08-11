---
name: green-gate
description: The verification gate every change passes before it is called done — typecheck, lint, tests, build, e2e, cheapest-first over the changed set, with a repair budget and evidence per gate. Invoke it after each implementation step and before any handover.
---

# Green gate

The gate is what makes an unattended run trustworthy. Without it the agent's report is a claim; with it, the report is a set of exit codes.

## The order

Cheapest and most localising first, so a failure is found in seconds rather than after a six-minute build:

1. **Typecheck** — the project's own typecheck command, or `tsc --noEmit`
2. **Lint** — where the repo enforces module boundaries, this is where an illegal import surfaces
3. **Unit tests**
4. **Build** — catches what typecheck alone misses: dependency graph, bundler config, tree-shaking of side effects
5. **E2E** — slowest, so last, and often the only gate that proves the feature actually works

Take the exact commands from `docs/agent/repo-map.md` → **Gates**, and the scope from its **Workspace** section: the changed-set command, or the fallback rung that repo uses. A project with no test command skips that gate — and the skip is recorded as a skip, never as a pass.

During the step loop, run gates 1–3 over the changed set. Before handover, run all five over the full changed set against the base branch. When the map says the changed set came from a low fallback rung, widen the final run — an imprecise scope is a reason to gate more, not less.

**The step loop stays serial.** Cheapest-first is the whole point: a typecheck error found in eight seconds costs nothing, and running the build alongside it to save time throws that away.

**The final run parallelises across projects.** Once the loop is done and the changed set spans several projects, their gates are independent — run them concurrently and collect every failure rather than stopping at the first. A handover that names four failures at once is worth more than four sequential discoveries. Within a project the order stays cheapest-first.

## The loop

```
run gate → green? → next gate
         → red?   → name the hypothesis → change → re-run this gate
```

The hypothesis is stated out loud in one line before the change. An attempt without a hypothesis is a guess, and guesses compound: each one moves the code further from a working state while looking like progress.

**Budget: three attempts per failing gate.** After the third, stop and revert to the last green commit. Write the failure report: the gate, its output, the three hypotheses, what each attempt showed. This is a successful run — a precise failure report is worth more than a green build that hides the failure.

Read `agentic-guardrails` for the full rule set, including the shortcut list that turns a red gate green without touching the defect.

## Reading a failure

Diagnose before changing. The failure message names a file and a line; the defect is often elsewhere.

- **Typecheck** — read the full error including the "types of property X are incompatible" tail. That tail is usually the actual mismatch, and the first line is only where it surfaced.
- **Boundary lint** — an illegal import means either the code is in the wrong project or the dependency genuinely should be allowed. The first is far more likely. Moving the code is the fix; editing the boundary rules is a spec-level decision.
- **Unit failure** — check whether the test's assumption or the code's behaviour is wrong before assuming the code. When the test is wrong, fix it *and* ledger why, because a silently corrected test is indistinguishable from a weakened one.
- **Build but not typecheck** — look at the bundler config, dynamic imports, and side-effectful modules that tree-shaking dropped.
- **E2E only** — check timing and test data before the code. Then hand a genuinely intermittent failure to `flaky-triage` rather than re-running it until it goes green.

## Evidence

Every gate run appends to `.agent/evidence/<id>/gates.md`:

```markdown
## typecheck — apps/orders
$ <the typecheck command from the map>
exit 0 · 12s
```

For a failure, include the last ~20 lines of output and, once it is fixed, what fixed it. This file is what `pr-package` hands to the reviewer, and what makes the difference between "tests pass" and a reviewable claim.

## Done when

Every applicable gate has exited zero over the full changed set, each has an entry in `gates.md`, every skipped gate is recorded as skipped with the reason, and the changed set matches the spec's blast radius — or the mismatch is reported as a finding.
