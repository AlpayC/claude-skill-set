---
name: domain-glossary
description: Resolves business vocabulary to code — which class, route, endpoint and table a domain term actually lives in, and the legacy names it still goes by. Run it when a ticket's wording has no obvious home in the code, when the same concept appears under several names, or when onboarding to an unfamiliar domain. Kept in docs/agent/glossary.md.
---

# Domain glossary

A ticket says "Vertragspartner-Zuordnung". The code says `PartnerAssignmentFacade`. Without a mapping, the agent searches for the German term, finds nothing, and either asks or guesses — and guessing at domain vocabulary produces code that works and models the wrong thing.

Enterprise domains have a second problem: the same concept under three names, one per generation of the codebase. The glossary records the aliases and marks which one is current.

## 1 — Harvest terms

Take terms from where the business speaks, not from where the code speaks:

- Ticket titles and descriptions (last ~50 issues)
- UI labels and i18n translation files — the richest source, because every user-visible string is a business term already mapped to a code key
- Enum values and status names
- Backend endpoint paths and payload field names

i18n files are the highest-yield source in a localised enterprise app: a translation key is literally a business term paired with a code identifier.

## 2 — Map each term to its code home

For every term, find the places it lives and record file paths:

- **Type or model** — the interface/class that represents it
- **UI** — the component or route where a user meets it
- **Data** — the endpoint that serves it, and the backend type behind it
- **State** — the store slice, service or query key that holds it

A term you cannot map is a finding: either the concept has no code representation yet, or it lives under a name nobody remembers. Both are worth recording as an open entry.

## 3 — Record the aliases

For each concept, list every name it goes by and mark exactly one as current:

```markdown
### Partner assignment
**DE:** Vertragspartner-Zuordnung · Partnerzuordnung
**Code (current):** `PartnerAssignment` — libs/domain/partner/src/lib/partner-assignment.model.ts
**Code (legacy, migrating away):** `ContractorLink` — libs/legacy/contracts/**
**UI:** apps/admin, route /partners/:id/assignments
**API:** GET /api/v2/partners/{id}/assignments
**Means:** The time-boxed link between a partner and a contract. Distinct from `PartnerRole`, which is permanent.
**Careful:** `ContractorLink` still appears in the admin app. New code uses `PartnerAssignment`.
```

The **Means** line does the work no naming convention can: it says what distinguishes this concept from its nearest neighbour. Concepts that are hard to tell apart are exactly where an agent silently picks the wrong one.

## 4 — Write and index

Write `docs/agent/glossary.md`, alphabetical by current code name, with a term index at the top mapping business terms → code names so a lookup from either direction lands. `arc42-sync` generates chapter 12 from this file, so it has one source.

## 5 — Keep it sharp during work

The glossary is worth as much as its precision, and precision decays through use. Three habits maintain it, applied while working rather than in a maintenance pass:

- **Challenge a term that conflicts.** When someone uses a word the glossary already defines differently, say so at once: *"the glossary has Stornierung as the full cancellation of an order, but you seem to mean cancelling one position — which is it?"* An unchallenged conflict becomes two meanings for one word, and then code that quietly implements the wrong one.
- **Sharpen a fuzzy term into a canonical one.** "Account" in an enterprise domain is usually two concepts wearing one name. Propose the distinction and record both.
- **Check claims against the code.** When someone states how something works, verify it. A contradiction between what people say and what the code does is one of the most valuable findings available — one of the two is wrong, and until you ask, nobody knows which.

## Done when

Every term harvested in step 1 either has an entry or appears under **Unmapped** with what was searched, every entry names at least one real file path that exists, and every conflict found between stated behaviour and code behaviour is recorded rather than silently resolved.

## Maintenance

Add an entry whenever a run had to work out a mapping — the second run should look it up rather than re-derive it. When a legacy alias disappears from the code, delete its line; a glossary that lists names nobody uses trains the agent to search for ghosts.
