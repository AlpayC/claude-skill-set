---
name: ci-authoring
description: Writes and changes CI/CD pipeline configuration — job graph, caching, changed-set filtering, matrices, artefacts — validated before pushing. Use it when adding a job, speeding up a pipeline, or fixing a config-class failure.
---

# CI authoring

Pipeline work has a bad feedback loop: the only real test is a push, each push costs minutes, and every failed attempt is visible to everyone. So validate as much as possible locally, and change one thing per push.

## Before writing

Read the existing pipelines end to end. A repo's CI usually encodes constraints nobody wrote down — a job that must run on a specific runner, an ordering that exists because of a licence server, a cache key shaped around a quirk. Changing it without reading it reintroduces problems that were already solved.

Establish the baseline: current wall-clock time per job, and which job is actually the bottleneck. Optimising a two-minute job while a nine-minute one runs beside it is effort spent on nothing.

## The shape of a good pipeline

**Fail fast, cheapest first.** Lint and typecheck before tests before build before e2e. A syntax error should cost thirty seconds, not nine minutes.

**Filter to the changed set** on pull requests, full run on the default branch. Take the changed-set command from `docs/agent/repo-map.md`; where the repo has no such tooling, the fallback ladder in the map's **Workspace** section applies. Filtering requires correct fetch depth — most CI checkouts default to a shallow clone, and comparing against a base the runner never fetched silently yields either everything or nothing.

**Cache what is expensive and keyed correctly.** The dependency store keyed on the lockfile hash; the build cache keyed on whatever the tool wants. A cache key that is too broad serves stale artefacts, which produces failures that look like code bugs — and that class of failure is expensive precisely because nobody suspects the cache.

**Parallelise across independent axes**, and merge results into one reported status so a reviewer sees one signal.

**Publish evidence as artefacts.** Test reports, coverage, Playwright traces, screenshots, bundle stats. An unattended run's CI output is what a human reads later — a failing e2e job with a trace attached is diagnosable, one with only a log is a re-run.

## Validate before pushing

In descending order of fidelity:

- **`act`** (GitHub Actions) or the platform's local runner, where the job does not need platform services
- **Schema validation** — `actionlint`, `az pipelines validate`, `glab ci lint`
- **Run the job's commands locally under CI conditions** — `CI=true`, `TZ=UTC`, a frozen install, the same runtime version as the image
- **A draft PR** for the parts that genuinely only run in CI

Then push once and read the run. Two changes in one push means a failure has two candidate causes.

## Guardrails

Read `agentic-guardrails`. Pipelines touch deployment and credentials, so these are firm:

- **Secrets are named, never valued.** A pipeline references `${{ secrets.X }}`; the value is set by a human in the platform UI. A secret needed and absent is a stop condition.
- **Deployment steps, environment protection rules and branch policies stay with the human.** Reading them is fine; changing what deploys where is outward-facing and irreversible in a way a code change is not.
- **Third-party actions are pinned to a commit SHA**, not a moving tag. A tag can be repointed at new code by someone outside your organisation, and it runs with your token.
- **The token gets the narrowest permission that works.** Start from read-only and add what the job proves it needs.
- **A check is disabled only as an explicit, ledgered decision** naming what it was protecting and when it comes back. Quietly weakening a gate to make a pipeline green removes the reason the pipeline exists.

## Done when

The change is validated as far as the platform allows before pushing, one change per push, the baseline timing is compared against the result, secrets and deploy steps are untouched, third-party actions are SHA-pinned, and every weakened or disabled check has a ledger entry with a return date.
