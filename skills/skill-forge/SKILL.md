---
name: skill-forge
disable-model-invocation: true
description: Write, revise and prune the skills in this set.
---

# Skill forge

Maintains this skill set. Invoked by hand, because writing a skill is deliberate work.

## Before writing

Ask whether a new skill is the right answer at all. Three cheaper options usually are:

- **A line in `CLAUDE.md`** — for a fact the agent needs on every run
- **A section in an existing skill** — for a branch of something already covered
- **A wiki page** — for an answer, rather than a process

A skill earns its own file when it is a **process with steps and a completion bar** that fires in a recognisable situation. Anything else is reference, and reference belongs in the skill that reaches it.

## What makes these skills work

The set has a house style, and it is the style that carries the autonomy:

**A named failure mode up front.** Each skill opens by saying what goes wrong without it. That is what makes the steps feel necessary rather than ceremonial, and it is what an agent reaches for when deciding whether the skill applies.

**Completion criteria that are checkable and exhaustive.** Every skill ends in a `## Done when` that a run can verify against. "Every gate has exited zero and has an entry in gates.md" bounds the work; "verification is complete" does not, and the difference shows up as premature completion.

**Positive targets, not prohibitions.** A ban drags the banned behaviour into context and half-reads as an instruction. Say what to do — `agentic-guardrails`' table is the pattern: the shortcut in the left column, the real fix in the right. Where a hard guardrail cannot be phrased positively, pair it with the positive target.

**One source of truth.** The ledger, the repair budget and the shortcut list live in `agentic-guardrails` and are referenced by name from everywhere else. Restating them would put three copies out of sync within a month, and inflate their apparent rank.

**Leading words.** `green`, `ledger`, `blast radius`, `changed set`, `drift`, `evidence`, `red`. Repeated as tokens, never redefined. They cost one word and anchor a whole region of behaviour; a passage spending a sentence to gesture at one idea is a passage waiting to collapse into one.

**Environment over cache.** Commands come from `docs/agent/repo-map.md` or from the tooling, not hardcoded into the skill. A skill that hardcodes `nx test` is a skill that breaks on the first repo that is not NX.

## Writing the description

The description is the trigger, and it is loaded on every turn whether or not it fires. Two jobs: say what the material is, and list the **distinct branches** that should reach it.

- Front-load the leading word — it does its triggering work at the start
- One trigger per branch; synonyms renaming one branch are that branch written twice
- Cut identity the body already carries

Set `disable-model-invocation: true` only when the skill should fire by hand alone. It costs zero context — and costs you the memory of its existence, and stops any other skill from reaching it. Anything in a chain stays model-invoked.

## Revising

Revision is mostly deletion. Working through an existing skill:

- **No-ops** — does this line change behaviour versus the default? "Be careful" does not. Delete the whole sentence rather than trimming it.
- **Duplication** — the same meaning in two skills. One keeps it; the other references it by name.
- **Sediment** — a line describing a tool, path or convention that has moved.
- **Sprawl** — the skill is simply too long, and attention thins across the excess. Push branch-specific reference into a sibling file behind a pointer, as `repo-cartograph` does with `WORKSPACE-KINDS.md`.

## Verifying

A skill is verified by **running it**, not by reading it. Pick a real task in the situation the skill claims to cover and watch for three signatures:

- It did **not fire** when it should have → the description is the problem, not the body
- It fired and the agent **skipped a step** → that step's completion criterion is too vague, or the step is buried under reference that should be disclosed
- It fired and produced the **wrong shape** → the output format is under-specified; show the template

## Done when

The skill has a named failure mode, steps with checkable criteria, a `## Done when` that is exhaustive, a description carrying its distinct triggers, no duplication of what `agentic-guardrails` owns, and one real run behind it with the three signatures checked.
