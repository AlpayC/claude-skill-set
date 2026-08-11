# Workspace kinds

Per-kind recipes for the three things detection needs: **enumerate** the projects, read the **graph**, and compute the **changed set**. Reached from `SKILL.md` step 1.

Flags move between major versions. When a command is rejected, read the tool's config file directly rather than guessing at a different flag — the config is authoritative and the CLI is a convenience over it.

## NX

```bash
nx show projects --json
nx show project <name> --json          # targets, tags, sourceRoot, implicitDependencies
nx graph --file=.agent/graph.json
nx show projects --affected --base=<base>
```

Config: `nx.json` (plugins, targetDefaults, named inputs), per-project `project.json` or the `nx` key in `package.json`.
Boundaries: `@nx/enforce-module-boundaries` in the ESLint config, keyed on project tags.
Gates: the project's `targets`. Run as `nx run <project>:<target>`.

## Turborepo

```bash
turbo ls                                # newer versions; else read the workspace globs
turbo run build --dry=json              # resolved task graph, including dependsOn
turbo run test --filter='...[<base>]'   # changed set plus dependents
```

Config: `turbo.json` for the pipeline; the package manager's workspace globs for membership.
Boundaries: not built in — look for ESLint `import/no-restricted-paths` or dependency-cruiser.
Gates: the scripts in each package's `package.json` that the pipeline names.

## pnpm / npm / yarn workspaces

```bash
pnpm -r list --depth -1 --json          # or: npm query .workspace / yarn workspaces list --json
pnpm --filter '...[<base>]' run test    # pnpm computes the changed set; npm and yarn do not
```

Config: `pnpm-workspace.yaml`, or the `workspaces` array in the root `package.json`.
Graph: derived from each package's `dependencies` on other workspace packages.
Boundaries: package `private` and `exports` fields, plus whatever ESLint enforces.
Changed set for npm/yarn: no built-in filter — use the fallback ladder below.

## Lerna / Rush

```bash
lerna list --json --all
lerna changed --json                    # against the last release tag, not a branch base
rush list --json                        # Rush
```

Lerna's `changed` compares to the last tag. For a branch-based changed set, use the fallback ladder.

## Single package

Projects: one. The map still earns its place — the stack slots, gate commands and seams are the parts downstream skills read.

```bash
node -e "console.log(Object.keys(require('./package.json').scripts).join('\n'))"
```

Changed set: the whole package. Gates run over everything; there is nothing to filter.

## Backend build systems

```bash
mvn -q -Dexec.executable=echo -Dexec.args='${project.artifactId}' exec:exec  # Maven modules
./gradlew projects                                                          # Gradle
dotnet sln list                                                             # .NET
go list ./...                                                               # Go
cargo metadata --format-version 1 --no-deps                                 # Rust
```

Boundaries: Maven/Gradle module dependencies, .NET project references, Go internal packages, Rust crate visibility. ArchUnit-style tests where present.
Relevant even from a frontend seat: `feature-trace` and `api-contract-sync` both cross into here.

## Polyrepo

Map each repo separately into its own `docs/agent/repo-map.md`, in that repo. Record the relationship under **Seams**: which repo serves the contract, which consumes it, where the other clone lives, and how the two are kept in sync (generated client, published package, copy-paste).

The changed set never crosses repos. A change here can still break there — that is what `api-contract-sync` is for.

## Fallback ladder for the changed set

When the tooling offers no affected computation, descend until one works:

1. **Changed files** — `git diff --name-only <base>...HEAD`
2. **Map files to projects** — walk each changed path up to its nearest manifest; that manifest's directory is the project
3. **Add dependents** — for each changed project, find who depends on it by searching the other manifests for its package name. One level is usually enough; go transitive when libs depend on libs.
4. **Root config changed** — a change to the lockfile, a shared `tsconfig`, a root ESLint config or a CI file affects **everything**. Skip the filtering and gate the whole repo.

Record which rung was used in the map's **Workspace** section, so `green-gate` knows how much to trust the scope.
