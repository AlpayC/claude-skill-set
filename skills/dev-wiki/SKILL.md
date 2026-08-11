---
name: dev-wiki
description: Answers how-do-we-do-X-here from the code and writes the answer back to docs/agent/wiki/ so it is looked up next time. Use it for a repeated question about the codebase, or after working something out that others will need.
---

# Dev wiki

Every question answered twice was work done twice. This skill makes the second answer a lookup.

The rule that keeps it useful: **an answer is never written without the evidence it came from**. A wiki page asserting how something works, with no file paths, is indistinguishable from a page describing how it used to work.

## Answering

**Check the wiki first.** `docs/agent/wiki/` — an existing answer is read, verified against the code (paths still exist, behaviour still matches), and used. Verification is the cheap part; skipping it is how a wiki starts lying.

**Derive from the code, not from general practice.** The question is about *this* repo. `pattern-mine` for how it is done here; `feature-trace` when the answer spans layers; `api-contract-sync` when it concerns the API.

**Answer with paths.** Every claim carries a `file:line`. A reader who disagrees can check, and a later run can re-verify.

**Say what you did not confirm.** "Auth tokens refresh in the interceptor at `libs/auth/.../token.interceptor.ts:41`; whether the retry queue preserves request order is not obvious from the code and I did not test it." That sentence is worth more than a confident guess, because the next reader knows where the ground stops.

## Writing it back

Write the answer to a file when it meets any of these:

- The question has now been asked twice
- Deriving it took more than a few minutes
- The answer is the kind that will be needed again by someone else
- A run stalled on it

Nothing else earns a file. A wiki that accumulates every passing thought is a wiki nobody searches.

```markdown
# How do we <X>?
Answered: <ISO> · Verified against: <sha> · Asked: <n> times

## Short answer
<Two or three sentences. Most readers stop here — make it the complete answer, not a teaser.>

## How it works
<With file:line for every claim.>

## Why it is like this
<Where known. Link the ADR if there is one; say "reason unknown" if there is not.>

## Gotchas
<What people get wrong about this.>

## Not confirmed
<The parts you inferred rather than verified.>
```

The **Why** section is the one that stops the page from being deleted-and-reinvented. If the reason is unknown and the decision looks deliberate, that is a prompt for `adr-capture`.

## Keeping it true

Each page carries the commit it was verified against. On reading a page, spot-check its paths; on finding it stale, update it then — a stale page found and left is worse than no page, because it will be believed.

When a page's content becomes enforced by a lint rule or a generator, delete the page and point at the rule. The check is now the source of truth, and prose beside it will drift.

## Index

Maintain `docs/agent/wiki/README.md` as a one-line-per-page index grouped by area, and link it from the root `CLAUDE.md`. An unindexed wiki is a directory nobody opens.

## Done when

The question is answered with a file:line for every claim, unconfirmed parts are marked, the answer is written to a file if it met one of the criteria, the page records the commit it was verified against, and the index has its line.
