---
name: pr-package
description: Assembles the handover a human reviews — PR description from the spec, the ledger surfaced as the decisions to check, evidence and screenshots, risk and rollback. Run it at the end of any unattended implementation, or when a branch is ready for review.
---

# PR package

An unattended run moves the human's attention from during to after. This document is what they attend to. Written well it takes five minutes; written as a change log it takes forty and the ledger goes unread.

Lead with what needs a decision. What was built is context; what you decided on their behalf is the thing only they can approve.

## What goes in

```markdown
## What and why
<Two or three sentences. What a user can now do, and why. Link the ticket and docs/specs/<id>.md.>

## Decisions I made for you
<The ledger, surfaced — not linked. Each entry: what was decided, the alternative,
why this one, and the cost of being wrong. Highest reversal cost first.
This is the section that must be read; put it above everything else.>

## Evidence
<Per acceptance criterion: the test, the screenshot, or an explicit "unverified" with its blocker.
Gate results as exit codes. Screenshots inline for every user-visible state.>

## Review guide
<Where to start reading, and which part deserves the most attention.
Name the file that carries the real logic. The rest is scaffolding and can be skimmed.>

## Risk and rollback
<What could break, who would notice first, how to revert. Whether it is behind a flag.
Whether it needs a backend deploy first — version skew, honestly stated.>

## Noticed but not done
<Everything out of scope that is now known: adjacent bugs, debt found, the shared lib
that wants refactoring. Each with enough detail to become a ticket.>

## Unverified
<Every state that could not be reached, every gate that could not run, with the blocker.
An empty section is stated as empty.>
```

## How to write it

**Decisions first, in reversal-cost order.** A reviewer who reads only the top section should have seen everything that would make them say "no, not like that".

**Screenshots inline, not attached.** A reviewer scrolling a diff will not open a file to check the empty state. In the description, they see it.

**Evidence as exit codes and output**, never as "all tests pass". The claim is the thing under review.

**Honesty about what was not verified.** The unverified section is what makes the rest of the document credible. A package claiming everything works is one the reviewer has to check from scratch; one that names its three gaps is one they can trust about the rest.

**No changelog of your process.** Which files changed is in the diff. Why they changed the way they did is not, and that is what this document is for.

## Commits

Before opening the PR, make the history readable: one commit per green step, each message naming the step and the spec id. A reviewer who wants to follow the reasoning reads the commits; a reviewer who wants the outcome reads the diff. Both should work.

## Guardrails

Read `agentic-guardrails`. Pushing and opening a PR is outward-facing: confirm with the human before the first push unless they have already said to go ahead. Publishing is not reversible in the way a local commit is — a CI run fires, reviewers get notified, and a draft PR is still a PR everyone can see.

## Done when

Every acceptance criterion appears in Evidence with its proof or its blocker, every ledger entry appears in Decisions ordered by reversal cost, screenshots for every user-visible state are inline, risk and rollback are stated, and the Unverified section is either populated or explicitly empty.
