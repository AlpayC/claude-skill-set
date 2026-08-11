---
name: self-review
description: The last gate before a human sees an unattended run — audits the evidence against the acceptance criteria, then reviews the diff in three fresh-context subagents for spec fidelity, repo conventions and runtime behaviour. Run it after implementation and before pr-package.
---

# Self review

Reviewing your own work in the context that produced it does not work. You still hold the reasoning behind every line, so you read the intention rather than the code — and the reviewer who receives it will have only the code.

Two things fix that. Audit the evidence rather than trusting the memory of having produced it, and hand the diff to reviewers who never saw it being written.

## 1 — Audit the evidence

Before reading any code. For each acceptance criterion in the spec, find the artefact that proves it and ask whether it actually proves it:

| Criterion says | Evidence is | Verdict |
|---|---|---|
| Error panel appears on 403 | `orders-error-403.png` showing the panel | Proven |
| Error panel appears on 403 | The unit test suite passed | **Not proven** — nothing exercised the 403 path |
| List renders within 2s at 500 rows | No artefact | **Not proven** — record as unverified |

An unattended run accumulates evidence that looks complete and covers the happy path. This audit is where that becomes visible, and it is cheap: a criterion with no artefact or with an artefact that proves something adjacent is **not done**, whatever the code looks like.

Confirm the blast radius while you are here: run the changed-set command from `docs/agent/repo-map.md` and compare against the spec's expected set.

## 2 — Dispatch three reviewers

Three subagents in parallel, each in **fresh context** — they see the diff and their own brief, never the reasoning that produced the change, so they judge the result on its own terms. Keep the axes separate: merged into one review, the loudest axis masks the others, and convention findings are always louder than behavioural ones.

Where the `spec-reviewer`, `convention-reviewer` and `runtime-reviewer` agent definitions are installed, dispatch those — they carry the briefs below and have no edit tools, so a reviewer cannot quietly become an author. Otherwise dispatch general agents with the briefs written out.

Give each the diff command (`git diff <base>...HEAD`) and the commit list.

**Spec.** Also give it the spec file. Brief: name requirements that are missing or partial; behaviour in the diff that no criterion asked for; and requirements that look implemented but where the implementation does not match what the criterion says. Quote the criterion for each finding. The third category is the one that matters — a criterion saying two seconds against code with a five-second timeout passes a glance and fails the spec.

**Conventions.** Also give it the root and project `CLAUDE.md`, and the pattern report from `pattern-mine`. Brief: where does this diff deviate from how this repo already does things? Cite the convention and the neighbouring file that follows it. Skip anything lint already enforces — a rule with a checker behind it does not need a reviewer.

**Runtime.** The diff alone, plus this list. Brief: answer each against the diff, citing the line, and say explicitly where the answer is "fine".

- What happens when the array is empty, the field is null, the response never resolves?
- What does the user see when this fails — is there a path where they see nothing at all?
- Does this leak: subscription, listener, timer, observer, abort controller?
- What re-renders when this value changes, and how often?
- Is there a race between these two async calls, or between a response and a navigation?
- Would this still behave with two of these components on one page?
- Is this state where it belongs, or where it was convenient?
- Is this test asserting behaviour, or asserting the implementation beside it?

## 3 — Aggregate without reranking

Report the three under their own headings. Do not merge them or rank findings across axes — the separation is the point, and reranking reintroduces the masking it prevents.

Then give every finding exactly one disposition:

- **Fix** — in scope and clearly wrong. Fix it, re-run `green-gate`.
- **Ledger** — a defensible decision a reviewer might question. Write the entry with the reasoning, so it surfaces in `pr-package`'s decisions section instead of being discovered in review.
- **Flag** — real but out of scope. Into the handover's `## Noticed` list with enough detail to become a ticket.

A finding with no disposition has been seen and lost, which costs more than not having looked.

## Done when

Every acceptance criterion is matched to an artefact that actually proves it or recorded as unverified, the changed set is compared against the blast radius, all three subagents have reported, and every finding carries one of the three dispositions.
