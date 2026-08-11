---
name: bug-hunt
description: Frontend and cross-repo defect diagnosis — observe it in the browser, make it repeatable, find the first wrong value, lock the fix behind a regression test. Use it for a bug report, something throwing, a regression, a console error, or something slow.
---

# Bug hunt

Two habits make agentic debugging expensive. Fixing where the error surfaced rather than where it originates — the stack trace names the crash site, and the crash site is rarely the defect. And declaring a fix with nothing that would have caught the bug, so the next regression is silent.

Both come from starting with a theory. Start with an observation instead.

## 1 — Observe

Reach the defect in a real browser using `visual-verify`'s tooling, and capture all four signals before forming any explanation. A screenshot alone explains almost nothing:

- **Console** — the complete error and stack, not the first line
- **Network** — the actual request and response, headers and payload included
- **State** — the store, query cache or signal graph at the moment it fails
- **DOM** — what rendered, versus what the component claims to render

The network signal is the one most often skipped and most often decisive: in a two-repo setup, a large share of "frontend bugs" are backend responses. Check the payload against `api-contract-sync` before suspecting your own code — a field that changed type or nullability produces failures that look exactly like render bugs.

Where it will not reproduce, that is the result. Record the conditions you tried and stop; a fix for a defect nobody observed has nothing to verify against.

## 2 — Make it repeatable

Turn the observation into **one command you can run unattended**. Everything after this consumes it, and its quality sets the ceiling for the whole run.

It qualifies when it fails now, passes once the defect is gone, asserts the user's actual symptom rather than "did not throw", gives the same verdict every run, and finishes in seconds. Run it once and record the invocation and output in `.agent/evidence/<id>/repro.md`.

Reach for whichever gets there fastest: a component or e2e test, a browser script asserting on console and network, an HTTP call against the dev server, or the failing payload saved from step 1 and replayed through the code path in isolation.

For an intermittent defect, aim at the **rate** rather than at a clean reproduction — loop the trigger, add load, narrow the timing window, delay the suspected race. Half the time is workable; one run in a hundred is not.

Then shrink it. Remove inputs, callers, config and steps one at a time, re-running after each removal, until everything left is load-bearing. What survives is both the smallest hypothesis space and the regression test in step 5.

## 3 — Locate the first wrong value

Trace forward along the path the data takes, and find the earliest point where it is already wrong. That point is the defect; everything downstream is consequence.

```
event → handler → state change → request → response → mapping → render
```

Check the seams first — they are where values change shape and where two sides disagree about nullability, naming or units. `feature-trace` covers the same path in depth when the bug spans both repos.

Two shortcuts that often beat reading:

- **When did it last work?** `git log -S '<symbol>'` against the repro, or `git bisect run` with the command from step 2. A commit that introduced it explains the cause faster than any amount of reading.
- **Which layer owns this value?** Where the store already holds the wrong value, nothing in the render layer is worth reading.

## 4 — Name the cause, then test it

State the cause in one sentence with no hedging:

> The facade caches the 403 response as an empty list, so the retry renders the empty state instead of the error.

A sentence needing "probably" is not yet a cause. Where several explanations remain live, write them ranked into `.agent/evidence/<id>/hypotheses.md`, each with the prediction that would distinguish it — *"if this is it, returning 200 with one row makes the empty state disappear"* — and test the top one. An explanation that predicts nothing cannot be tested, and testing it is how attempts get spent without learning anything.

Change **one variable per attempt**. Where logging is unavoidable, prefix every line with a marker you can search for afterwards, so cleanup is exhaustive rather than remembered.

For a performance defect, measure before changing anything — profiler, timing harness, query plan. Logs are the wrong instrument, and a performance fix without a before-and-after measurement is a guess with a changelog entry.

The repair budget in `agentic-guardrails` governs from here: three attempts, hypothesis named before each, then revert and report.

## 5 — Lock it

Write the regression test **before** the fix, at a seam that exercises the pattern as it actually occurs at the call site. Watch it fail, apply the fix, watch it pass, then re-run the step 2 command against the original unshrunk scenario.

Where the only reachable seam is too shallow to reproduce the pattern — a unit test for a defect that needs two components interacting — a test there manufactures confidence rather than catching anything. **The missing seam is the finding.** Record it and rely on `visual-verify` evidence instead, naming the limitation in the handover.

## 6 — Widen and record

A defect is rarely alone. Search for the same mistake elsewhere: the same missing null check, the same swallowed error, the same assumption about ordering. Fix what the spec's blast radius covers, list the rest in the handover.

Then run `green-gate`, remove every marked debug line and throwaway harness, and put the cause in the commit message so whoever debugs nearby next inherits it.

What deserves to outlive the fix:

- A gotcha in the app's `CLAUDE.md`, so the next run does not step in it
- A `dev-wiki` page where the question will be asked again
- `adr-capture` where the cause was a deliberate architectural choice rather than a mistake
- `autonomy-postmortem` where the defect came from an earlier unattended run

## Done when

The defect was observed with all four signals captured, a repeatable command was recorded and run, the first wrong value is located, the cause is stated in one sentence without hedging, the fix sits behind a regression test at a correct seam or the missing seam is documented, the class has been searched for further instances, debug instrumentation is gone, and the gate is green.
