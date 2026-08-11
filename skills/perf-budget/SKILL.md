---
name: perf-budget
description: Establishes and enforces frontend performance budgets — bundle size per app, Core Web Vitals, render cost — measured identically every time so a regression is visible the day it lands. Use it when a bundle grew, a page feels slow, or to set up the gate.
---

# Perf budget

Frontend performance degrades by accumulation: every change adds a little, no single change is worth objecting to, and the app is slow a year later with no commit to blame. A budget converts that into a check that fails on the commit responsible.

## 1 — Measure the baseline

Measure before setting any number. A budget invented from best practice either fails on day one or is loose enough to permit the regression you were guarding against.

**Bundle.** Production build per app, then the composition: initial versus lazy chunks, the ten largest modules, the shared vendor chunk. Use the bundler's own analysis (`--stats-json`, `rollup-plugin-visualizer`, `source-map-explorer`) — a raw byte total tells you a number changed, not what changed.

**Runtime.** Lighthouse on the routes that matter, in a consistent configuration: LCP, CLS, INP, TBT. Run it three times and take the median; a single Lighthouse run is noise wearing a number.

**Render.** For screens that felt slow, a profiler trace: what re-renders, how often, what is doing the work.

Record all of it in `docs/agent/perf-baseline.md` with the commit and the measurement conditions. Numbers measured under different conditions cannot be compared, and the comparison is the entire point.

## 2 — Set the budgets

Two numbers per metric, both derived from the baseline:

- **Warn** — roughly current plus 5%. Prompts a look.
- **Fail** — the point at which the user experience is genuinely worse, or the number the team agreed to hold.

Set the fail threshold at what you will actually enforce. A budget that gets bypassed twice is dead — it will be bypassed every time after that, and its existence gives false assurance.

Budget the initial bundle per app separately from lazy chunks. A shared lib growing is a different problem from one app importing something large, and one number hides which happened.

## 3 — Gate it

In CI, on pull requests: build, measure, compare against the baseline, comment the delta. The delta on the PR is what makes this work — a developer who sees "+180 KB initial" while reviewing their own change fixes it there, and the same information found a month later becomes a ticket nobody picks up.

Store the baseline on the default branch so the comparison is always against what is shipped.

## 4 — Diagnose a regression

When a budget fails, find the cause before touching the threshold:

- **Diff the bundle composition** against the baseline. A new large module, or an old one moved from lazy into the initial chunk.
- **Check for a dropped lazy boundary.** A static import of something previously imported dynamically pulls the whole subtree into the initial chunk. This is the single most common cause of a sudden jump, and it is usually one line.
- **Check for a duplicated dependency** — two versions of the same library, or a lib bundled in two apps that should share it.
- **Check for a full-library import** where a specific one existed: `import _ from 'lodash'` versus `import debounce from 'lodash/debounce'`.
- **After a `dep-upgrade`**, compare against the pre-upgrade baseline — upgrades are the most common silent cause.

## Guardrails

Read `agentic-guardrails`. The pressure here is always toward moving the number:

- **The budget is raised only as a ledgered decision** with the reason and what was tried first. Raising it to make CI green removes the only thing that was watching.
- **Measurement conditions stay identical.** Same build mode, same machine class, same Lighthouse config, same number of runs. Comparing across conditions produces confident wrong conclusions.
- **A performance fix is measured, not asserted.** Before and after, same conditions, in the evidence directory.

## Done when

The baseline is recorded with its commit and conditions, warn and fail thresholds exist per app for bundle and for the vitals that matter, the CI gate comments the delta on pull requests, and any regression found has a named cause rather than a raised threshold.
