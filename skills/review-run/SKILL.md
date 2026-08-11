---
name: review-run
description: Presents a finished or stopped run in the conversation for review — decisions first with a recommendation, screenshots rendered inline, gaps named — then applies the verdicts immediately. Use it when asked to review a run, to go through what happened overnight, or when a run has handed over. The review happens here, so nothing has to be copied between a viewer and the agent.
---

# Review run

The reviewer's attention is the scarce resource in an agentic setup, and it is spent badly by default: an evenly-weighted list of everything that happened, in a viewer that cannot act on the answer.

Two rules fix that. **Decisions before evidence**, because only decisions need judgement — evidence needs checking, which is faster. And **the review happens where the answer can be acted on**, so a verdict costs a sentence rather than a copy, a window switch and a paste.

## 1 — Find what needs review

With no id given, scan for runs and present them in this order:

1. **Blocked** — `status: stopped` in `.agent/current-run.json`, or a note in `.agent/handoff/`. The human is the blocker here, so it goes first.
2. **Handed over** — evidence present, `pr-package` written.
3. **Failed** — a failure report but no handover.

For an overview across many runs at once, `tools/evidence-board.mjs` renders them as columns. This skill is for going *into* one.

## 2 — Present one run

One run at a time. A wall of three runs gets one run's worth of attention spread thin.

**The headline, one line.** Gates, screenshots, console — the numbers, so the reviewer knows what kind of run this was before reading anything.

**Decisions, in reversal-cost order.** For each high or medium entry: what was decided, what the alternative was, and **your own recommendation with its reason**. A decision presented without a recommendation turns into a design discussion the reviewer did not ask for; presented with one, it is answered in a word.

Low-cost entries get one summarising line for the group, not an entry each. Spending the same attention on a `trackBy` choice as on a shared-library change is how the shared-library change gets waved through.

**Screenshots inline.** Send them into the conversation rather than naming their paths — a path is something the reviewer has to go and open, and they will not. This is the step that makes the review possible without a second window.

**Gaps and unverified, as questions.** Not "10,000 rows unmeasured" but "unmeasured at 10,000 rows — acceptable for an admin list?". The reviewer is being asked to accept a risk, so phrase it as the decision it is.

**Then stop and wait.** Presenting all runs before taking any answer wastes the context the first answer would have changed.

## 3 — Apply the verdicts

**Confirmed** — nothing to do. Do not restate it back.

**Overruled** — this is a change request, at the cheapest possible moment. Implement it through the normal loop: `pattern-mine` if it creates something, `green-gate` after, `visual-verify` again if it changed anything visible.

Then amend the ledger entry. **Amend, never rewrite** — the disagreement is the valuable part:

```markdown
## A3 — Shared lib angefasst
**Decided:** libs/ui/table um einen rowAction-Slot erweitert.
**Why this one:** Drei Konsumenten wären sonst auseinandergelaufen.
**Reversal cost:** High.
**Overruled 2026-08-12:** In der Feature-Lib gelöst, Duplikat akzeptiert.
**Reason given:** Die geteilte Lib ist eingefroren bis das Design-System-Update durch ist.
```

That block is the record of where agent and human diverged, and it is the raw material for the next step.

**Risk accepted** — record it in the spec's Unverified section as accepted, with who accepted it and when. An accepted risk that is not written down becomes an incident nobody saw coming.

## 4 — Close the loop

Every overruled decision is a **thin spec**, not a bad agent. The reason the human gave — "the shared lib is frozen", "we always redirect on 403" — was knowable before the run and was not written down anywhere the agent could read.

So each overrule goes through `autonomy-postmortem`: classify it, and land the reason in `CLAUDE.md`, the glossary, or the spec template. A review that only fixes this run leaves the same overrule waiting in the next one.

Where several overrules in one session point at the same area, that is not several findings but one: that area needs an ADR or a wiki page, not three one-line fixes.

## Done when

Every run in scope has been presented and answered, every overrule is implemented and re-gated, every ledger entry is amended rather than rewritten, every accepted risk is recorded with who accepted it, and every overrule has been through `autonomy-postmortem`.
