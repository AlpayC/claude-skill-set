---
name: grill-spec
description: Finds the holes in a spec before code exists — works a fixed set of frontend dimensions for the unstated state, the missing permission case, the timezone bug, the thing that breaks at 10,000 rows. Run it on a spec draft before implementation, on an architecture decision you are about to commit to, or when a plan needs holes found rather than agreement. Findings go back into the spec.
---

# Grill spec

Every question answered here is one the implementation does not stop for. Every one missed becomes a bug report with a screenshot attached.

Agreeing with a plan produces nothing its author did not already have, so be relentless: the job is to find what is missing and keep pulling until the answers stop being confident.

## How to ask

**Look it up rather than asking.** Anything discoverable — how the neighbouring feature handles this, what the endpoint returns, which roles exist, what the design system offers — is yours to find, with a subagent where it is a real search. The user's time is for decisions only; asking them a question you could have answered yourself spends it on the wrong thing and teaches them the session is expensive.

**Ask in batches of three to five**, and wait for answers before the next batch. Twenty questions at once get twenty shallow answers.

**Order by dependency.** Some answers unlock other questions — whether errors surface inline or as a toast determines what the error copy questions even are. Ask what unblocks the most first, and hold back anything whose phrasing depends on an answer you do not have yet.

**Carry a recommendation.** Every question comes with the answer you would give and why:

```
Q2 — Empty state, first use vs. filtered to nothing
The mockup shows one empty state. These usually need different copy: a new user
needs orientation, a filtered-out user needs a way back.
→ Recommend: two states. Filtered-out gets a "Filter zurücksetzen" action,
  matching PartnerTable (apps/admin/.../partner-table.component.ts:61).
```

A question with a recommendation gets answered in a word. One without turns into a design session the user did not ask for.

**Push once on every vague answer.** "We'll handle that in the error boundary" is not an answer; "which boundary, and what does the user see" is the question it deserves.

## The dimensions

Work all of them. Skip one only after checking it genuinely does not apply — not because the answer feels obvious.

**States.** No data yet versus no data ever — different copy? First load versus refetch with stale data on screen? Which errors are possible — network, 403, 404, 422 with field errors, timeout — and what does each look like? What if half the data loads?

**Permissions.** Which roles reach this screen, and what does each see? Hidden, disabled, or absent? What happens when permission is revoked while the page is open? Is the check enforced server-side, or only hidden in the UI?

**Scale.** What at 10,000 rows? What is the largest realistic payload, and has anyone measured it? Pagination client or server side, and does the sort agree with that choice? What re-renders when one item changes?

**Time and locale.** Which timezone — server, user, or a business timezone? What across a DST boundary? Are the strings translated, and do the longest translations fit? Right-to-left? Number, date and currency formats per locale?

**Concurrency.** Two users editing the same record? A double submit? A response arriving after the user navigated away? Optimistic update — and what is the rollback?

**Input.** Does frontend validation match the backend's? Paste, autofill, empty string versus null, whitespace only, a 4,000-character name, an emoji, an apostrophe in a surname?

**Accessibility.** Reachable by keyboard alone? Where does focus go after the modal closes, the row deletes, the error appears? Is the error announced? Does it survive 200% zoom? Is any state conveyed by colour alone?

**Integration.** What breaks in the shell if this app loads slowly? Which other app consumes the library you are changing? Is the API contract confirmed or assumed? What happens on version skew between a deployed frontend and a newer backend?

**Reversal.** How is this rolled back in production? Behind a flag? What would the first symptom be if it broke, and who would see it?

## The two closing questions

Ask these at the end of every session — they reach what a fixed checklist structurally cannot:

1. What did I not ask about that matters?
2. If this ships and causes an incident, what is the most likely cause?

## Write it back

Three lists, and all three go into the spec:

- **Resolved** — into the spec's Decisions section, with the reasoning
- **Deferred** — into Out of scope, explicitly, so it reads as a choice rather than an oversight
- **Unresolved** — the ones that should stop implementation until settled. These are the reason the session happened; leaving them out of the spec makes the whole thing decorative.

## Done when

Every dimension has been checked, every question carried a recommendation, every fact was looked up rather than asked, every vague answer was pushed on once, the two closing questions were asked, and all three lists are written into the spec.
