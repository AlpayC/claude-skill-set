---
name: adr-capture
description: Records an architectural decision as a numbered ADR in docs/adr/ — context, options weighed, choice, consequences. Run it when a decision constrains future work, when a pattern is deliberately broken, or when nobody can say why the code is like this.
---

# ADR capture

The expensive question in an enterprise codebase is not "what does this do" — the code answers that. It is "why is it like this", and the code cannot answer it at all. An ADR is where that answer survives the person who knew it.

## When a decision earns an ADR

The test is **reach** — does it constrain work beyond this change? — and all three of these must hold:

1. **Hard to reverse.** Changing your mind later costs something real.
2. **Surprising without the context.** A future reader will ask why it was done this way.
3. **A genuine trade-off.** There were defensible alternatives and one was chosen for stated reasons.

Miss any one and it is a ledger entry, not an ADR. Promoting small decisions is how a `docs/adr/` directory ends up with forty files and nobody reading any of them.

Earns one: choosing a state management approach for an app; how apps share authentication; where a boundary between libraries falls; adopting or dropping a library; a deliberate deviation from an established pattern; a performance trade-off with a real cost.

Does not: which variable name, which utility, anything a reviewer settles in one comment.

A ledger entry gets promoted when it turns out others will have to live with it.

## The document

`docs/adr/NNNN-kebab-title.md`, numbered sequentially and never renumbered — an ADR is referenced by number, so the number is an identifier.

```markdown
# NNNN — <Decision in one line>
Status: Accepted · Date: <ISO> · Deciders: <names>
Supersedes: <NNNN, if any>

## Context
<The forces. What was true that made this a decision rather than an obvious step:
constraints, deadlines, existing code, team skills, what had already been tried.
Written so someone in two years understands the situation without having lived it.>

## Options
<Each option considered, with its real trade-off. Including the ones rejected —
especially the obvious one, because that is what a future reader will propose.>

## Decision
<What was chosen, stated actively. "We use X for Y.">

## Consequences
<Both directions, honestly.
Good: what this makes easier.
Bad: what this makes harder, what it costs, what it forecloses.
Neutral: what now has to be true — a convention to follow, a check to keep.>

## Revisit when
<The condition that would make this decision wrong. "If we exceed three apps
sharing this lib" or "if the vendor ships native support".
This line is what stops an ADR from being permanent by default.>
```

The **Options** and **Revisit when** sections carry most of the value. An ADR with only a decision reads as an edict; one that shows the rejected alternatives lets a future reader see whether their new idea was already considered under different conditions.

## Writing one after the fact

Most ADRs are written late, for a decision nobody recorded. That is worth doing — reconstruct from the evidence rather than inventing:

- `git log` around when the pattern first appeared, and the PR discussion on that commit
- The code itself: what the structure implies was being optimised for
- What was in the ecosystem at that date — the option that looks obvious now may not have existed

Mark reconstructed context as reconstructed. An honest "the reasoning is inferred from the commit history" is more useful than a confident guess, because the next reader knows how much weight to put on it.

## Maintenance

ADRs are immutable. A decision that changes gets a **new** ADR that supersedes the old one, and the old one's status becomes `Superseded by NNNN` — its context stays valuable, because it explains why the code looked that way for three years.

`arc42-sync` indexes this directory as chapter 9 — an index, never a copy, so the decision text lives in exactly one place. Link individual ADRs from `CLAUDE.md` where they constrain day-to-day work, so an agent meets the constraint before violating it rather than after.

## Done when

The ADR is numbered and dated, every section is filled including the rejected options and the revisit condition, reconstructed reasoning is marked as such, any superseded ADR has its status updated, and the decision is linked from wherever an agent would need to know it.
