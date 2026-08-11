---
name: dep-upgrade
description: Runs dependency and framework upgrades in staged, independently verifiable commits with the breaking-change reading done up front. Use it for a framework major, a tool migration, a security advisory, or any bump large enough to break something.
---

# Dep upgrade

Upgrades fail in a characteristic way: everything is bumped at once, forty things break, and the causes are indistinguishable. Staging converts one unreadable failure into a sequence of readable ones.

## 1 — Read before running

Establish what you are walking into. Use the repo's own migration tooling where it has some — it applies code transforms the manual path leaves to you:

| Workspace kind (from the map) | Migration entry point |
|---|---|
| NX | `nx migrate <target> --dry-run`, then read `migrations.json` before applying |
| Angular | `ng update <pkg> --dry-run` |
| Anything with codemods | the package's own codemod CLI |
| Everything else | the package's migration guide, applied by hand |

For every package crossing a major version, read its migration guide and write down the breaking changes that touch **this** repo specifically. "Breaking changes exist" is not preparation; "`HttpClientModule` is deprecated and we import it in nine places" is — and the count comes from a search, not an estimate.

Check peer dependencies for conflicts before starting. A peer conflict discovered halfway through contaminates every stage after it.

Record the baseline: a full `green-gate` run over the whole repo *before* any change. An upgrade cannot be evaluated against an unknown starting state, and a test that was already red will otherwise be blamed on the upgrade.

## 2 — Stage it

Each stage is its own commit, gated before the next begins:

1. **Manifest and lockfile only** — versions bumped, install run, no code touched. Commit. Expect red; the point is a clean rollback point separating "the versions changed" from "the code changed".
2. **Run the automated transforms** — where the tooling has them. Read the resulting diff rather than trusting it: transforms are good and not perfect, and they occasionally rewrite code they should have left alone. Commit.
3. **Fix the fallout, one package or one breaking change per commit**, each with its own gate run. This is the stage that pays for itself: when something is subtly wrong three weeks later, `git log` names the change that did it.
4. **Deprecations** — a separate commit, or leave them and record the debt. Mixing deprecation cleanup into an upgrade makes the diff unreviewable.

Between stages, gate the **whole repo**, not the changed set. A dependency upgrade affects everything, so changed-set filtering is misleading here.

## 3 — Verify beyond the gates

Type-level and test-level green is not sufficient. Runtime behaviour changes without breaking a type:

- **`visual-verify` on one screen per app.** A framework major can change rendering, focus behaviour, hydration or change detection while every test stays green.
- **Bundle size** per app against `perf-budget`'s recorded baseline. Upgrades are the most common cause of a silent size jump.
- **Build output** — new warnings, new peer warnings, newly deprecated APIs in the log.
- **The lockfile** — read it for transitive major bumps no direct dependency asked for.

## Guardrails

Read `agentic-guardrails`. Specific to upgrades:

- **A version is pinned back only with a ledger entry naming what broke.** Silent pinning is how a repo ends up unable to upgrade at all.
- **`--force` and `--legacy-peer-deps` are stop conditions**, not steps. A conflict that only resolves by overriding it changes what actually gets installed, and that is a decision for a human.
- **The lockfile is committed** with the change that caused it, never separately.
- Where a package is abandoned or the path is genuinely blocked, stop and hand back with the finding. An upgrade half-applied and reported as done is worse than one not attempted.

## Done when

Every stage is committed with its own gate run, the full repo gate matches or improves on the recorded baseline, one screen per app has been visually verified, bundle sizes are compared against baseline, every pinned-back version has a ledger entry, and the remaining deprecations are listed as known debt.
