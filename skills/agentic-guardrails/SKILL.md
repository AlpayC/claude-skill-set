---
name: agentic-guardrails
description: The rules that let implementation finish without asking the human — assumption ledger, repair budget, stop conditions, the shortcuts that fake a green build, evidence, blast radius. Read it before any autonomous implementation, refactor, migration or bug fix, and whenever a run is about to ask a mid-implementation question.
---

# Agentic guardrails

Shared reference for every skill that changes code without a human watching. The single source of truth for these five rules — other skills invoke this rather than restating them.

Four of them also exist as hooks, installed by `guardrail-hooks`: destructive commands, protected paths and the blast radius, the shortcut list, and the evidence requirement. Where they are installed, those rules are enforced rather than requested. The reasoning stays here, because a block that does not explain teaches nothing.

## The ledger

Mid-implementation questions are almost never blocking. They are decisions with an obvious-enough default and a cost of being wrong that a reviewer can absorb. So you do not ask — you **decide, record, and continue**.

Every decision you would have asked about goes in the ledger at `docs/specs/<id>.assumptions.md`:

```markdown
## A3 — Error state for expired session
**Decided:** Redirect to /login with a toast, matching `OrdersPage` (apps/orders/src/pages/orders.page.ts:88).
**Alternative:** Inline error panel with a re-auth button.
**Why this one:** Two of three comparable pages already redirect; consistency beats novelty here.
**Blast radius if wrong:** One component, ~15 lines.
**Reversal cost:** Low.
```

Write the entry *before* you implement the decision, so the ledger reflects reasoning rather than justification after the fact.

A decision qualifies for the ledger when a competent reviewer could plausibly pick either option and the reversal cost is low or medium. Rank the alternatives by what the codebase already does — the strongest tiebreaker available is an existing pattern in a comparable place, found with `pattern-mine`.

### The four cases that stop the run instead

Stopping means: finish everything the blocker does not touch, write the ledger, write a handover note naming exactly what you need, and hand back.

1. **Irreversible or outward-facing** — data migration, deleting a table, force-push, publishing a package, touching production config, anything that sends mail or money.
2. **Secrets and credentials** — a step needs a value only the human holds.
3. **Contradiction in the source of truth** — the spec says one thing, the API contract another. Guessing here produces confidently wrong work.
4. **Blast radius exceeds the spec** — the change requires touching projects the spec did not list. See below.

Everything else: ledger it.

## Repair budget

Autonomous runs fail by grinding: the same test fixed five different ways, each attempt further from a real solution. So repair is budgeted.

**Three attempts per failing gate.** An attempt is a hypothesis plus a change plus a re-run. Between attempts, state the hypothesis in one line — if you cannot name what you think is wrong, you are guessing, and the attempt is spent for nothing.

After the third attempt on the same failure: stop repairing. Revert to the last green commit, write a failure report naming the failing gate, the three hypotheses, and what each attempt showed. A precise failure report is a successful run; a green build that hides the failure is not.

## Green means green

The failure modes below all produce a passing build that reports nothing about the code. They are the specific way autonomous runs go wrong, so they are named rather than left to judgement.

Make the code satisfy the check:

| Instead of | Do this |
|---|---|
| `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` | Model the type, or narrow with a type guard |
| `eslint-disable` | Fix what the rule flags |
| `test.skip`, `it.only`, deleting a failing test | Fix the code, or fix the test's wrong assumption and say so in the ledger |
| Updating a snapshot to match new output | Read the diff; update only after confirming the new output is correct, and say why in the ledger |
| `--force` or a cache bypass to move past an error | Diagnose the error |
| Widening a test's assertion until it passes | Keep the assertion, fix the behaviour |
| Retrying a flaky test until it goes green | Hand it to `flaky-triage` |

When one of these is genuinely the right answer — a third-party type is wrong, a rule does not apply here — it is a ledger entry with a named reason and a narrow scope, never a silent line.

## Evidence

"It works" is a claim, and every claim carries its receipt: the command and its output, or a screenshot. No receipt, no claim — report it as untested instead.

Evidence lives in `.agent/evidence/<id>/` and is collected as you go, not reconstructed at the end:

- `gates.md` — each gate command with its exit code and tail of output
- `*.png` — screenshots from `visual-verify`, named for the state they show (`orders-empty.png`, `orders-error-403.png`)
- `console.md` — browser console and network errors, or an explicit "none"

`pr-package` turns this directory into the handover. A run that produced no evidence has nothing to hand over.

## Blast radius

The spec names the projects and paths you may change. That list is the boundary of the run.

Before editing outside it, check which case applies:

- **A shared project needs a change** to make the feature work → that is a spec-level decision. Ledger it *and* flag it prominently in the PR, because it affects consumers the spec never considered.
- **An unrelated broken thing** blocks you → fix the minimum that unblocks, in its own commit, named as such. Resist the adjacent cleanup; it makes the diff unreviewable.
- **The feature is simply larger than the spec assumed** → this is case 4 above. Stop and hand back with the corrected scope.

The boundary is checkable: the changed-set command in `docs/agent/repo-map.md`, or `git diff --name-only <base>...HEAD` where the repo has no such tooling, shows what you actually touched. Run it before handover and compare against the spec's list. A mismatch is a finding, not a footnote.
