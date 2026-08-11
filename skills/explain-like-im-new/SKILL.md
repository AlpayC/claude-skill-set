---
name: explain-like-im-new
description: Explains an app, library or subsystem at three zoom levels — business purpose, data flow, code layout — every claim anchored to a real file path. Use it when onboarding to an unfamiliar app or writing an onboarding document.
---

# Explain like I'm new

Two explanations fail in opposite directions: the one that stays abstract and teaches nothing actionable, and the one that dives into files and never says why any of it exists. The fix is to give all three levels, in order, so the reader can stop at the depth they needed.

Anchor every claim to a path. An explanation without file paths cannot be checked, and cannot be used to actually go and look.

## Level 1 — What it is for

Three to five sentences, business-first. Who uses this, what job it does for them, and how it relates to the neighbouring apps. No framework names.

The test: someone who does not write code understands what the app is for.

Sources: the UI itself (run it and look, via `visual-verify`'s tooling), route names, i18n strings, the glossary, ticket history. Route names and translation files describe the domain far better than the module structure does.

## Level 2 — How it works

One end-to-end trace of the single most representative user action, from click to pixel. Concrete, named, with paths:

```
User clicks "Auftrag freigeben" (orders.release)
  → apps/orders/.../release-button.component.ts:34
  → OrdersFacade.release() — libs/domain/orders/.../orders.facade.ts:88
  → POST /api/v2/orders/{id}/release — generated client, libs/api/orders
  → optimistic update of the orders store, rollback on error
  → the row re-renders as "Freigegeben"; a toast confirms
```

Then the map around it: where state lives, where the API boundary is, how routing and lazy loading are arranged, what this app shares with others and what it owns alone.

Also name **what is odd**. Every enterprise app has two or three surprising things — a legacy adapter, a duplicated model, a workaround for a platform bug. Naming them prevents the reader spending a day deciding whether it was a mistake. This is usually the highest-value paragraph in the document.

## Level 3 — Where things are

The navigation layer: which folder holds what, the naming conventions, where to add a new feature, where the tests live, which files are generated and must not be hand-edited.

Then the practical part — how to run it, its preconditions, and the three failure modes a newcomer hits first. Where a runbook already exists, link it instead of restating it.

## Verify before writing

Explanations drift because they are written from the structure rather than from the behaviour. Before publishing, check the claims that are easiest to get wrong:

- Run the trace in level 2 against the real code, following each call. A trace with one wrong hop is worse than no trace.
- Confirm every path exists.
- Where you inferred a purpose, mark it as inferred.

## Where it goes

For a durable answer, write to `docs/agent/wiki/<app>.md` via `dev-wiki`, so the explanation is looked up next time instead of regenerated. For a one-off question, answer in conversation — but if the same question comes twice, it earns a file.

## Done when

All three levels are written, every path cited exists, the level 2 trace has been followed against the real code, the odd things are named, and anything inferred is marked as inferred.
