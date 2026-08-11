---
name: epic-map
description: Plans work too large for one spec or one session — cuts it into vertical slices that each become a spec, records the decisions that block them, updates itself from what execution teaches. Use it for a feature spanning several apps, a migration, or when the question is where to start.
---

# Epic map

Work larger than one session fails in two ways. Attempted in one run, it exhausts the context somewhere in the middle and leaves a half-finished branch nobody can assess. Decomposed in the human's head each time, it costs the same conversation every session and loses whatever the last session learned.

The map is the durable middle. It holds the cut, the open decisions and the accumulated learning; each slice is a session's worth of work that ends in a merged change.

## What a slice is

**One slice, one spec, one session.** The constraint is context, not ambition — a slice that needs two sessions was cut too big, and the fix is to cut it again rather than to push through.

**Slices are vertical.** Each ends in something observable: a user can do something they could not before, or a system behaves differently in a way you can point at. Horizontal slices — all the types, then all the components, then all the tests — cannot be verified, cannot be shipped, and hide their own incompleteness until the last one lands.

The test: can this slice produce a `## Done when` that someone could check? If not, it is a layer, not a slice.

**A slice is ready when every decision it depends on is settled.** Not when it is next in the list.

## 1 — Name the destination

What is true when this epic is finished, in observable terms. Two or three sentences, written so a session that reads only this line still knows what it is aiming at.

Then the boundary: what is explicitly **not** in this epic. The out-of-scope list does more work here than anywhere else, because a multi-session effort drifts outward a little in every session.

## 2 — Find the decisions before the slices

Cutting before deciding produces slices that dissolve on contact. Run `grill-spec` across the whole epic first, breadth-first rather than deep on one thread — the point is to surface what is unsettled everywhere, not to resolve one area completely.

Each open decision gets an entry naming which slices it blocks. A decision blocking nothing is not worth tracking; a decision blocking four slices is what the next session should spend itself on.

Many decisions wait on a fact rather than on a judgement — what the endpoint already returns, whether the design system has this component, how the other app solved it. Dispatch a subagent per fact, all at once, and keep asking the rest of your questions while they run. Only the decisions downstream of a given fact wait for it; a session that blocks on one lookup has spent an hour of its one slice on waiting.

Decisions that need a human are the epic's real bottleneck, so they surface here, at planning time, where the human is present anyway — rather than mid-implementation, where the whole point is that they are not.

## 3 — Cut what you can see

Cut only the slices you can specify **now**. The rest stays in `## Noch unscharf` — the areas you can tell are coming but cannot phrase precisely yet.

The test for the boundary is whether you can *state* the slice precisely, not whether you can *do* it yet. A slice that is fully specifiable but blocked by a decision is a slice; one you can only gesture at is not.

Resist pre-cutting the unclear part into slice-shaped pieces. Half of them turn out to be one slice, and a quarter turn out to be unnecessary once an earlier decision lands.

## 4 — Write the map

`docs/epics/<id>.md`:

```markdown
# <id> — <title>
Started: <ISO> · Last session: <ISO> · Status: <n> of <m> slices done

## Ziel
<Observable end state, two or three sentences.>

## Nicht im Umfang
<Explicit. Re-read at the start of every session.>

## Offene Entscheidungen
| # | Entscheidung | Blockiert | Braucht | Status |
|---|---|---|---|---|
| E1 | Optimistisch oder pessimistisch aktualisieren | S3, S4 | Produktentscheid | offen |
| E2 | Wo lebt der geteilte Filterzustand | S2, S5 | — | entschieden → ADR 0007 |

## Slices
| # | Slice | Ergebnis | Hängt ab von | Spec | Status |
|---|---|---|---|---|---|
| S1 | Endpunkt anbinden, Liste rendern | Nutzer sieht echte Daten | — | docs/specs/S1.md | merged |
| S2 | Filterleiste | Nutzer kann filtern | S1, E2 | docs/specs/S2.md | offen |
| S3 | Inline-Bearbeitung | Nutzer ändert eine Zeile | S1, E1 | — | blockiert |

## Noch unscharf
<Areas you can see coming but cannot specify yet, one line each.>

## Gelernt
<One line per finished slice: what turned out different from the plan.>
```

## 5 — Work one slice

Each session:

1. Read the map — destination, out-of-scope, and the slice table. Not every spec.
2. Take the first slice whose dependencies and decisions are all settled. Where none is ready, the session's work is a **decision**, not a slice: resolve it with `grill-spec`, record it, and stop.
3. Run `spec-forge` for that slice, then `implement-spec`.
4. Write back — the step below.

## 6 — Write back what execution taught

A map that only ever gets ticked off is a Gantt chart, and it will be wrong by slice three. The value is in this step.

After each slice, update:

- **Status**, derived from the artefacts — a slice is done when its spec's `## Done when` is met and the change is merged, not when it feels finished
- **Gelernt** — one line on what turned out different from the plan
- **Later slices** that the reality of this one has changed: re-cut, merge, or drop them
- **Offene Entscheidungen** — resolved ones marked with where the reasoning lives, and any new ones this slice exposed
- **Noch unscharf** — anything that has become specifiable graduates into a slice and leaves this section, so it lives in exactly one place

A slice that turns out to be unnecessary gets dropped with one line saying why. That line is worth as much as a finished slice — it is the record of scope the epic consciously did not take.

## Done when

The destination and the out-of-scope list are written, every open decision names the slices it blocks, every slice is vertical and produces something observable, no slice was cut from an area you could not yet phrase precisely, and after each session the map reflects what that session actually learned.
