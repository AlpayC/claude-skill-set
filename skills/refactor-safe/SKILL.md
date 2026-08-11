---
name: refactor-safe
description: Behaviour-preserving change at scale — establish the safety net, move in small green committed steps, prove nothing changed. Use it for renames, extractions, moving code between projects, replacing a pattern across many files, or splitting a component.
---

# Refactor safe

A refactor changes structure and preserves behaviour. The danger in an unattended refactor is that behaviour drifts a little at each of forty files and nobody can tell which step did it. The cure is that no step is ever large enough to hide a drift.

## 1 — Establish the net

Refactoring code that has no tests is editing code with your eyes closed. Before touching anything, check the coverage of the behaviour you are about to move.

Where the net has holes, write **characterisation tests** first: tests that assert what the code currently does, right or wrong. They are not a judgement about correctness — they are the tripwire that tells you the refactor changed something. Behaviour they capture that turns out to be a bug gets fixed in a separate commit, after the refactor, never during.

Record the pre-refactor state: the gate output, and for UI, `visual-verify` screenshots of the affected screens. This is your before picture, and without it "nothing changed" is an opinion.

## 2 — Prefer the codemod

For a mechanical change across many files — a rename, an import path move, an API signature change — write the transform rather than editing by hand:

- The workspace tool's own move and remove generators for project-level moves (`nx g move`, and equivalents), because they update path aliases, project references and the graph — hand-moving a project leaves stale references the compiler finds and the tooling does not
- `ts-morph` or `jscodeshift` for TypeScript-aware transforms
- The language server's rename-symbol for simple renames

A codemod is reviewable as one rule instead of forty diffs, applies uniformly, and does not tire at file thirty. Reserve hand-editing for the cases the transform cannot express — and list those cases explicitly so the reviewer knows where the uniformity breaks.

Search-and-replace over raw text is the tempting shortcut here; it matches strings inside comments and unrelated identifiers. Use an AST-aware tool.

## 3 — Move in green steps

Each step compiles, passes, and commits. Order the sequence so the workspace is never broken between commits — an intermediate state that does not build has no gate that can pass, which removes the rollback point the whole approach depends on.

The safe sequence for most large moves:

1. Add the new thing alongside the old
2. Point consumers at the new one, a few at a time, gating between
3. Confirm the old one has no remaining references
4. Delete the old one

Four commits, each independently revertible, instead of one commit nobody can review.

Run `green-gate` after every step. The changed set is the honest scope: computed after each step with the command from the map, it shows whether the blast radius is what you expected. A step that suddenly reaches twelve more projects than the last one has touched something shared — stop and check that this was intended.

## 4 — Prove behaviour was preserved

- Full `green-gate` over the complete changed set, compared against the pre-refactor run
- `visual-verify` on the touched screens, compared against the before screenshots
- The diff read once specifically for behaviour: a changed default, a flipped condition, a removed guard, an altered order of operations

Behaviour changes found along the way go in their own commit, named as behaviour changes, and into the ledger. Mixing them into the refactor is what makes a refactor unreviewable.

## Guardrails

Read `agentic-guardrails`. Specific to refactoring:

- **Behaviour preservation outranks the target design.** A refactor that improves the structure and changes what the user sees has failed at the thing it was for.
- **The blast radius is the spec's**, even though a refactor is always tempted outward. Improvements you notice go in the handover's `## Noticed` list.
- **Deleting a test is a behaviour change.** A test that no longer compiles after a rename gets updated, not removed.

## Done when

Every step is committed green, the changed set at each step was expected, the full gate matches the pre-refactor run, the visual comparison shows no unintended difference, and any behaviour change is isolated in its own commit and ledgered.
