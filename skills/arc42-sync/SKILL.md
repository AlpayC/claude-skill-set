---
name: arc42-sync
description: Maintains architecture documentation as an arc42 document under docs/architecture/ — generates the chapters derivable from code, marks the ones that are not, drift-checks the generated ones. Run it to set up arc42, to refresh after a restructure, or as a CI check.
---

# arc42 sync

arc42 fails in a predictable way: twelve chapters get created, three are filled, nine keep their template prose, and within two quarters the three that were filled are wrong. Nobody notices, because nothing checks them.

The fix is to treat the chapters as three different kinds of document. Some are derivable from the code and therefore checkable. Some are human knowledge that no amount of analysis produces. Confusing the two is what fills a repository with confident, stale prose.

## The three kinds of chapter

Every chapter carries its kind in its header. The drift check only fires on **generated** ones.

| # | Chapter | Kind | Source |
|---|---|---|---|
| 1 | Einführung und Ziele | **human** | Stakeholders, quality goals — nothing in the code says why the system exists |
| 2 | Randbedingungen | **assisted** | Tech constraints from manifests and CI; organisational ones from people |
| 3 | Kontextabgrenzung | **generated** | External systems from config, base URLs, third-party SDKs, auth provider |
| 4 | Lösungsstrategie | **human** | The reasoning behind the approach |
| 5 | Bausteinsicht | **generated** | Project list and dependency graph from `docs/agent/repo-map.md` |
| 6 | Laufzeitsicht | **assisted** | Scenarios traced with `feature-trace`; which scenarios matter is a human call |
| 7 | Verteilungssicht | **generated** | CI/CD pipelines, infrastructure config, deployment targets |
| 8 | Querschnittliche Konzepte | **assisted** | Auth, error handling, i18n, logging — patterns from the code, intent from people |
| 9 | Architekturentscheidungen | **generated** | Index of `docs/adr/` — never a copy of it |
| 10 | Qualitätsanforderungen | **human** | Quality scenarios, with measured values from `perf-budget` where they exist |
| 11 | Risiken und technische Schulden | **assisted** | Debt from the ledgers, flake register and Noticed lists; risk assessment from people |
| 12 | Glossar | **generated** | From `docs/agent/glossary.md` |

**Leave a chapter out rather than filling it with template prose.** arc42 is explicit that not every system needs all twelve, and an empty chapter costs more than a missing one: it looks answered. Where a chapter genuinely does not apply, one line saying so and why is the complete chapter.

## 1 — Set up the skeleton

`docs/architecture/`, one file per chapter so diffs stay reviewable and chapters can be regenerated independently:

```
docs/architecture/
  README.md          index, and which chapters exist
  01-einfuehrung-ziele.md
  03-kontextabgrenzung.md
  05-bausteinsicht.md
  ...
```

Each file opens with its status line:

```markdown
# 5 — Bausteinsicht
Kind: generated · From commit: <sha> · Generated: <ISO date>
```

For assisted and human chapters, the line names who owns it and when it was last confirmed, because an unowned human chapter is the one that goes stale silently.

## 2 — Generate what is derivable

**Chapter 3, Kontextabgrenzung.** Business context: which user groups and which neighbouring systems exchange what with this system. Technical context: the protocols and interfaces, taken from base URLs in environment config, third-party SDKs in the manifests, message brokers, and the contract format recorded under **Seams** in the repo map.

**Chapter 5, Bausteinsicht.** Level 1 is the whole system decomposed into its top-level building blocks — for a multi-app repo, the apps and the shared library groups. Level 2 opens the blocks that carry real complexity. Stop there unless a specific block earns level 3; the deeper the level, the faster it goes stale and the fewer people read it. Take the blocks and their dependencies from the repo map, and give each a one-line responsibility.

**Chapter 7, Verteilungssicht.** What is deployed where, derived from pipeline definitions and infrastructure config: build artefacts, targets, environments, which apps deploy independently.

**Chapter 9, Architekturentscheidungen.** A table indexing `docs/adr/` — number, title, status, date. Never a copy of the content; `adr-capture` owns that, and duplicating it creates two versions that will disagree.

**Chapter 12, Glossar.** Generated from `docs/agent/glossary.md`, business-term first for readers who are not in the code.

Every generated element cites the evidence it came from. An element that cannot be derived gets marked `<!-- manual -->` and is skipped by the drift check — keep that list short and dated, because each entry is a claim nothing verifies.

## 3 — Diagrams as Mermaid

Mermaid renders in most wikis, in the repository browser and in editors, and it diffs as text — which is what makes both review and drift-checking possible. An exported image is a binary blob whose wrongness nobody will notice.

Chapters 3, 5 and 7 each carry one diagram. Keep them small: a building block view with thirty boxes communicates that there are thirty boxes. Split by bounded context and link between the chapters.

## 4 — Check for drift

Re-derive the generated chapters and compare against what is committed. Report concrete differences, each naming its evidence:

- A project in the repo that chapter 5 does not show, or a block in chapter 5 that no longer exists
- A dependency in the graph with no corresponding relation, or a relation with no dependency
- An external system or base URL in chapter 3 that changed
- A deployment target in chapter 7 that the pipeline no longer has
- An ADR in `docs/adr/` missing from chapter 9's index
- A manual element or an assisted chapter older than the staleness window

In CI, run it on the default branch. Fail on structural drift in generated chapters; warn on stale assisted ones. A check that fails on cosmetic differences gets disabled within a month, and then nothing is checked at all.

## Done when

Every existing chapter carries its kind, owner and source commit, chapters that do not apply say so in one line rather than carrying template prose, every generated element cites its evidence or is marked manual, chapters 3, 5 and 7 each have one readable diagram, and the drift check has run and reports either no differences or a concrete list.
