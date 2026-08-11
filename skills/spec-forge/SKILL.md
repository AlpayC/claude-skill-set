---
name: spec-forge
description: Turns a ticket or a paragraph of intent into an executable spec at docs/specs/<id>.md — acceptance criteria, affected projects, contract impact, test seams, blast radius, and steps that each carry a verify command. Run it before any change larger than one commit.
---

# Spec forge

The spec is where the human spends their judgement, so the implementation does not have to interrupt them for it. Every question this document leaves open becomes a mid-run question or a wrong guess. Write it to be **executable**: a competent agent should be able to run it end to end without a conversation.

## 1 — Gather the ground truth

Before writing anything, collect what the spec must be consistent with:

- **The ask** — ticket text, or the user's paragraph. Quote it verbatim in the spec; paraphrase drifts.
- **The map** — `docs/agent/repo-map.md` for which projects the change touches and what their stacks are.
- **The vocabulary** — `docs/agent/glossary.md` for what the business terms mean in code.
- **The contract** — `api-contract-sync` for the real shape of every endpoint involved. A spec that assumes a field the API does not serve fails at implementation time, when it is expensive.
- **The precedent** — `pattern-mine` on the nearest comparable feature. The spec should say "like X, but Y", because that is both shorter and more precise than describing the target from scratch.

## 2 — Write the acceptance criteria

Criteria are **observable**, in Given/When/Then, phrased so a test could assert them and a human could check them in a browser. "The list loads quickly" is not a criterion; "the list renders within 2s on a 3G profile with 500 rows" is.

Cover the full state matrix, because the happy path is the part nobody forgets:

- **Empty** — no data yet, and no data ever (different messages, usually)
- **Loading** — first load, and refetch while showing stale data
- **Error** — network failure, 403, 404, 422 with field errors, timeout
- **Partial** — some data present, some failed
- **Permission** — each role that can reach this screen, and what each sees
- **Boundary** — long strings, 10,000 rows, missing optional fields, dates across timezones

Run `grill-spec` over the draft. Its whole purpose is to find the criteria you did not write.

## 3 — Draw the blast radius

Name the projects and paths the implementation may change:

```markdown
## Blast radius
Allowed: apps/orders/src/app/features/checkout/**, libs/domain/orders/src/**
Touch only with a ledger entry: libs/ui/shared/**
Off limits: apps/*/src/environments/**, anything generated
Expected changed set: orders, orders-e2e, domain-orders
```

This is what makes an unattended run safe to leave unattended. The expected set is checkable at the end with the changed-set command from the map's **Workspace** section — it either matches or it is a finding. In a repo with no changed-set tooling, express the blast radius as paths and check with `git diff --name-only <base>...HEAD`.

## 4 — Resolve the decisions in advance

Walk the design and find every fork where two answers are defensible: which component library primitive, where the state lives, optimistic or pessimistic update, client or server pagination, how errors surface.

For each, either **decide it here** with a reason, or mark it `→ ledger` so the implementation decides and records it. Nothing stays merely open. An open fork in the spec is a guaranteed interruption.

## 5 — Name the test seams

A test needs a boundary to observe behaviour at, and picking one badly produces a suite that goes red whenever anything moves. Deciding it here is what lets `tdd-frontend` run without stopping to ask mid-implementation.

For each area the work touches, name the seam and say why:

```markdown
## Seams
Checkout form → the `CheckoutForm` component's public props and rendered output.
  Existing: `PartnerForm` is tested the same way (apps/admin/.../partner-form.spec.ts).
Order creation → the orders facade, not the HTTP client. The client is generated.
```

Three rules, in order of precedence: prefer a seam the neighbouring code already uses over introducing a new one; take the **highest** seam that can still observe the behaviour, because a high seam survives refactoring beneath it; and keep the count low — every new seam is another interface the tests are coupled to.

## 6 — Write the step plan

Steps are **atomic and independently verifiable**. Each carries the command that proves it landed:

```markdown
### Step 3 — Wire the checkout form to the orders facade
Touches: apps/orders/src/app/features/checkout/checkout.component.ts
Verify: `<the project's test command, narrowed to this area>`
Done when: submitting a valid form dispatches createOrder and renders the pending state
```

A step without a verify command is not a step — it is a wish. If a step cannot be verified by a command, either it is too big and splits, or its verification is a screenshot from `visual-verify`, which you name explicitly.

Order steps so the build stays green between them. A step that leaves the workspace broken has no verify command that can pass, which means the run has no safe rollback point.

## 7 — Write the spec

`docs/specs/<id>.md`:

```markdown
# <id> — <title>
Source: <ticket link or "user request", with the ask quoted>
Projects: <from the map> · Stacks: <per project>

## Intent
<Two sentences: what changes for the user, and why now.>

## Acceptance criteria
<Given/When/Then, full state matrix>

## Out of scope
<Explicit. The list that stops scope creep mid-run.>

## Contract impact
<Endpoints used, fields relied on, drift status>

## Seams
<Where the tests observe behaviour, and why each one>

## Blast radius
<As above>

## Decisions
<Resolved forks with reasons; forks delegated to the ledger>

## Steps
<Atomic, each with verify command>

## Definition of done
<Every gate that must be green, plus the evidence required>
```

Create the empty ledger at `docs/specs/<id>.assumptions.md` at the same time, so the implementation has somewhere to write from its first decision.

## Done when

Every acceptance criterion is observable, every step has a verify command that has been checked to exist, every fork found in step 4 is either decided or delegated, every area the work touches has a named seam, the blast radius names an expected changed set, and `grill-spec` has been run over the draft with its findings either answered or listed as out of scope.
