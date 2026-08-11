---
name: api-contract-sync
description: Keeps the frontend's view of the backend API true — locates the contract, regenerates the typed client, reports drift. Run it before touching an endpoint, when a request fails on shape, or when the backend moved ahead. Answers what an endpoint actually returns.
---

# API contract sync

An unknown API shape is the single most common reason a frontend run stalls and asks a human. The contract is knowable — it lives in the backend repo. This skill fetches it, types it, and names what changed.

## 1 — Locate the contract

`docs/agent/repo-map.md` → **Seams** records where it is. When that is blank, find it in this order and write the answer back into the map:

- **Served spec** — the running backend exposes `/swagger/v1/swagger.json`, `/v3/api-docs`, `/openapi.json`, or a GraphQL introspection endpoint. Most authoritative: it is what is actually deployed.
- **Committed spec** — an `openapi.yaml` / `schema.graphql` in the backend repo. Authoritative for what is merged, which may be ahead of or behind what runs.
- **Generated from code** — controllers with attributes/decorators and a generation step. Run the generation step rather than reading the controllers by hand.
- **Nothing formal** — the contract lives in the controller signatures. Read them and write down what you found in `docs/agent/api-contract.md`, marked as *derived, not authoritative*.

Record which source you used and its commit or timestamp. Drift analysis is meaningless without knowing which two things were compared.

## 2 — Regenerate

Use the repo's existing generator if there is one — a build target, a script in `package.json`, an `orval` / `openapi-typescript` / `graphql-codegen` config. Run it. Types that a generator owns are never hand-edited: the next regeneration silently discards the handwriting, and the bug that produces looks like anything but a merge artefact.

When no generator exists, generating types by hand is a legitimate outcome, but it is an architectural gap: note it for `adr-capture` rather than quietly normalising it.

## 3 — Report the drift

Diff the regenerated output against what was committed. Classify every change, because the classes have very different consequences:

| Class | Example | Consequence |
|---|---|---|
| **Breaking** | field removed, type narrowed, required added, enum value removed | Frontend code compiles against a lie until it is fixed. Fix now or stop. |
| **Additive** | new optional field, new endpoint, new enum value | Safe. But a new enum value with an exhaustive `switch` is breaking in disguise — check the switches. |
| **Cosmetic** | description text, ordering, formatting | Commit and move on. |

For each breaking change, name the frontend call sites: search the whole repo for the operation name and the changed field. A drift report without call sites makes the human do the search you could have done.

## 4 — Answer the shape question

When a run needs "what does `GET /orders/{id}` return", answer from the contract with the field names, types, nullability and enum values — and say explicitly which fields are optional. Nullability is where generated clients and real payloads most often disagree; when the spec says required and the payload is missing it, trust the payload and record the discrepancy as a contract bug for the backend team.

## Guardrails

Read `agentic-guardrails` before changing anything. Specific to this skill:

- **The backend repo is read-only from here.** A frontend run does not edit backend code, even when the contract is wrong. It writes the discrepancy into the drift report and continues against the contract as served.
- **A shape mismatch is never fixed with `any`.** Model what the endpoint actually returns and ledger the discrepancy.
- **Mock data follows the contract.** When mocks and generated types disagree, the mock is wrong; a green test suite over wrong mocks is the most expensive kind of green.

## Done when

The generated client matches the named contract source, every breaking change has its frontend call sites listed, and the drift report is at `.agent/evidence/<id>/contract-drift.md` — or the report says explicitly that nothing drifted.
