---
name: repo-cartograph
description: Builds and refreshes docs/agent/repo-map.md — workspace kind, every project with its stack, the boundary rules, the gate commands, and how to compute the changed set. Run it when onboarding a repo, when the map is stale, or after projects change. Every other skill reads it instead of re-detecting.
---

# Repo cartograph

The same questions — what is this project, how do I test it, what may it import, what did my change affect — get asked on every run. The map answers them once. Everything downstream reads `docs/agent/repo-map.md`; nothing else re-detects.

The map is written the same way regardless of how the repo is organised. Only the **detection** differs, and that is what step 1 settles.

## 1 — Identify the workspace kind

Detect before assuming. A repo can also be several kinds at once — a monorepo containing an independently built subfolder is common.

| Signal | Kind |
|---|---|
| `nx.json` | NX |
| `turbo.json` | Turborepo |
| `pnpm-workspace.yaml` | pnpm workspaces |
| `workspaces` in root `package.json` | npm / yarn workspaces |
| `lerna.json` | Lerna |
| `rush.json` | Rush |
| One `package.json`, no workspace field | Single package |
| `pom.xml` / `build.gradle*` / `*.sln` / `go.work` / `Cargo.toml` with `[workspace]` | Backend build system |
| No shared root; separate clones | Polyrepo — map each repo separately, link them via **Seams** |

Read [`WORKSPACE-KINDS.md`](WORKSPACE-KINDS.md) for the per-kind commands: how to enumerate projects, read the dependency graph, and compute the changed set. It also carries the fallback ladder for repos whose tooling offers none of that.

Record the kind, its version, and the enumeration command in the map. When two kinds coexist, record both and say which part of the tree each governs.

## 2 — Enumerate the projects

Ask the tooling first — its config is the source of truth and it cannot go stale. Where there is no tooling to ask, derive projects from the directory structure: a project is a directory with its own manifest (`package.json`, `pom.xml`, `csproj`, `go.mod`).

Record for each: name, type (app / lib / e2e / service), path, and any tags or grouping metadata the tooling carries.

## 3 — Detect the stack per project

Per project, never one answer for the whole repo — even a single-package frontend has a backend sibling with a different stack. Resolve these slots from evidence, writing `unknown` where evidence is absent, because a wrong entry costs more than a blank one:

| Slot | Where the evidence lives |
|---|---|
| Framework | dependencies in the project's manifest, build config, executor or script names |
| Language variant | `tsconfig` strictness, file extensions in the source root |
| Test runner | `jest.config.*`, `vite.config.*`, `karma.conf.*`, `pytest.ini`, the test script |
| E2E | sibling e2e project, `playwright.config.*`, `cypress.config.*` |
| State / data layer | store or query dependencies — confirm against two real source files, not just the manifest |
| Styling | SCSS, Tailwind config, CSS modules, styled-components in the source root |
| HTTP layer | generated client, framework HTTP wrapper, `fetch` wrapper — name the file that owns it |

State and HTTP are the slots downstream skills get wrong most often, because a dependency being installed does not mean this project uses it. Confirm both against real files.

**Fan out across projects.** Detection is pure reading and each project is independent, so past roughly five projects, dispatch a subagent per project — or per batch of three or four in a large workspace — and have each return only the filled slot table plus the evidence path for each. A fifteen-app workspace goes from a long serial crawl to one round, and the subagent contexts absorb the file reading instead of yours.

Where the returned slots disagree about something workspace-wide — two projects reporting different base branches, say — resolve it yourself against the config rather than trusting the majority.

## 4 — Extract the gate commands

Per project, the exact commands that constitute green: typecheck, lint, test, build, e2e. Take them from the project's own scripts or targets, not from memory of what the tool usually calls things. Record which gates **do not exist** — a project with no test script is a fact `green-gate` needs in order to report a skip rather than a pass.

Also record how to compute the changed set for this repo (from `WORKSPACE-KINDS.md`) and the default base branch.

## 5 — Extract the boundary rules

Whatever enforces architecture here, in descending order of strength:

- Tag-based rules (`@nx/enforce-module-boundaries` and equivalents) — record the full tag-to-tag matrix
- Import restrictions in ESLint (`no-restricted-imports`, `import/no-restricted-paths`)
- A dependency-cruiser or ArchUnit-style ruleset
- Package visibility: `private`, `exports` fields, module systems, package-level access modifiers
- **Convention only** — nothing machine-enforced. Record the convention *and* the fact that nothing checks it, because an agent will otherwise assume lint would have caught a violation.

## 6 — Locate the seams

- **Across repos** — where the other repo lives on disk or in git, how the API contract is expressed (OpenAPI path, GraphQL schema, hand-maintained types), and which project owns the generated client. Hand the detail to `api-contract-sync`.
- **Within the repo** — for micro-frontends or modular monoliths: which project composes the others, who owns which routes, what deploys independently.

## 7 — Write the map

`docs/agent/repo-map.md`:

```markdown
# Repo map
Generated: <ISO date> · Repo: <name> · Commit: <sha>

## Workspace
Kind: <nx | turbo | workspaces | lerna | single | polyrepo | mixed> <version>
Enumerate: `<cmd>` · Graph: `<cmd or "derived from manifests">`
Base branch: <name> · Changed set: `<cmd or the fallback used>`

## Projects
| Project | Type | Framework | Test | Tags | Path |

## Project detail
### <project>
Stack: <the slots from step 3>
Depends on: <projects> · Consumed by: <projects>
Dev server: <command> (port <n>) · Route base: <path>
Gates: typecheck `<cmd>` · lint `<cmd>` · test `<cmd>` · build `<cmd>` · e2e `<cmd or none>`

## Boundaries
Enforced by: <mechanism, or "convention only — nothing checks this">
<matrix or rule list>

## Seams
Contract: <where, what format, who owns the client>
Composition: <which project composes what>

## Unknowns
<Every blank slot, with what evidence would fill it>
```

The **Unknowns** section is load-bearing. A downstream skill hitting a blank knows to investigate; hitting a plausible-looking wrong value, it does not.

## Done when

Every project the enumeration returns appears in the map, the workspace kind and changed-set command are recorded and have been run once, every slot is either filled from named evidence or listed under Unknowns, and every gate command in the map has been executed once to confirm it exists and exits.

## Staleness

The map carries the commit it was generated at. Before relying on it, re-run the enumeration: a project the map lacks means the map is stale, and refreshing it is cheaper than working around the gap.
