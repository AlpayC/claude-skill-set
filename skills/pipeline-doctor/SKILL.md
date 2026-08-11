---
name: pipeline-doctor
description: Diagnoses a failing CI run — fetches the logs, finds the first real error rather than the loudest, classifies it as code, flake, infrastructure or config, and fixes what is fixable locally. Use it when a pipeline is red, or a build passes locally and fails in CI.
---

# Pipeline doctor

CI failures are diagnosed badly by default because the log is long, the real error is near the top, and the loudest output is near the bottom. Work top-down and classify before fixing.

## 1 — Fetch the logs

```bash
gh run list --branch <branch> --limit 5
gh run view <id> --log-failed          # GitHub: only the failing steps
az pipelines runs show --id <id>       # Azure DevOps; logs via the REST API
glab ci trace                          # GitLab
```

Where no CLI is available, read the log through the web UI. Reading the whole log unfiltered wastes the run — start from the failing step.

Take **the first error**, not the last. Everything after the first failure is usually consequence: a build that failed produces test failures, missing artefacts and cleanup errors, none of which are the cause.

## 2 — Classify

The class determines the fix, and misclassifying costs the most time. Establish it before changing anything:

| Class | Signature | Response |
|---|---|---|
| **Real** | Reproduces locally on the same commit | Fix the code — `bug-hunt` or `green-gate`'s repair loop |
| **Flake** | Same commit passes on re-run; timing, ordering or network-shaped | Hand to `flaky-triage`. Not a re-run. |
| **Infrastructure** | Runner out of disk, registry timeout, network unreachable, image pull failure | Not yours to fix in code. Report it; retry once is legitimate here. |
| **Config** | Missing secret, wrong runner image, cache key collision, permissions | Fix the pipeline via `ci-authoring` |
| **Environment gap** | Passes locally, fails in CI | See below — the most common and most misdiagnosed |

## 3 — When it passes locally and fails in CI

The difference is always the environment. Check these in order, because each is cheaper to check than the next:

- **Node, package manager or runtime version** — the CI image versus your local. The most common single cause.
- **Install mode** — CI uses a frozen lockfile; local may have drifted. Run the frozen install locally and see if it still passes.
- **Case sensitivity** — a Linux runner with a Windows or macOS development machine. `import './Button'` versus `./button` works locally and fails in CI, and the error message names the module, not the case.
- **Environment variables** — present locally, absent in CI. Especially anything read at build time.
- **Cache** — a stale CI cache serving artefacts from a different dependency tree. Re-run with the cache cleared to test this.
- **Time and locale** — the runner is UTC with a different locale; tests asserting formatted dates fail there and nowhere else.
- **Parallelism** — CI runs tests in parallel or in a different order, exposing shared state between tests.
- **Headless browser** — different version, no GPU, different default viewport, fonts absent.

Reproduce locally under CI's conditions before fixing. A fix pushed to see whether it works costs a full pipeline per attempt, and the repair budget in `agentic-guardrails` runs out in twenty minutes.

## 4 — Fix and verify

Fix the class you identified. Verify locally under CI-like conditions where possible: the same runtime version, a frozen install, the same test command as the pipeline, `TZ=UTC` and `CI=true` set.

Then push once and watch the run. A second failure means the classification was wrong — go back to step 2 rather than trying a second fix on the same theory.

## Guardrails

Read `agentic-guardrails`. Specific to CI:

- **Re-running is not a fix.** A job that passes on the second attempt without a change is a flake, and it goes to `flaky-triage`. Left alone, it trains everyone to re-run, and a real failure then hides among the noise.
- **Retries and `continue-on-error` are not fixes either.** Both convert a visible failure into an invisible one.
- **Secrets stay untouched.** A pipeline failing on a secret is a stop condition — a human holds the value.
- **A disabled check is a decision**, not a step. Ledger it, name what it was protecting, and flag it in the PR.

## Done when

The first real error is identified and classified, the class is confirmed rather than assumed, the fix is verified under CI-like conditions locally, one push has been made and watched, and anything not fixable here — infrastructure, secrets, flakes — is reported with what is needed.
