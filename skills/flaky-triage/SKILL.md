---
name: flaky-triage
description: Handles a test that passes and fails on the same code — confirms the flakiness, finds which of the five causes it is, then fixes or quarantines it. Use it for an intermittent failure, or when CI goes green on a re-run without a change.
---

# Flaky triage

A flaky test is a test that reports noise. Left alone, it teaches the team to re-run rather than read, and by the time it has taught that, a real failure goes unnoticed. Retries hide the symptom and keep the cost.

## 1 — Confirm it is flaky

Run the test in isolation, repeatedly, on the unchanged commit:

```bash
<test cmd> --testNamePattern='<name>' --runInBand   # repeat 20×
```

Then run the whole file, then the whole suite. **Where it passes alone and fails in the suite, the flakiness is shared state, not timing** — that distinction decides everything downstream, so establish it before theorising.

Record the failure rate. One failure in twenty and one in two are different problems with different urgencies.

## 2 — Find the cause

Five causes account for nearly all of them:

**Shared state.** A previous test left a module registry, a global, a store, a DOM node, a spy or a database row behind. Signature: passes alone, fails in suite; the failure moves when the order changes. Confirm by running with a fixed seed and bisecting the test order.

**Timing.** A fixed wait instead of a condition; an assertion racing an async update; a debounce or animation not accounted for. Signature: fails more on a loaded machine, more in CI than locally.

**Time and timezone.** `new Date()` in the assertion path, a test that fails near midnight, or only in UTC, or on the day the month rolls over. Signature: fails at specific times of day, or only in CI.

**Ordering.** The test asserts an order that the code does not guarantee — object key iteration, unsorted query results, parallel promises resolving in a different order.

**External dependency.** A real network call, a real clock, a real filesystem, a container that is sometimes not ready.

## 3 — Fix at the cause

| Cause | Fix |
|---|---|
| Shared state | Reset in teardown; better, stop sharing — build fresh fixtures per test |
| Timing | Wait for the condition (`findBy*`, `waitFor`), not for a duration; use fake timers deliberately |
| Time | Inject the clock, or freeze it in the test |
| Ordering | Assert on a set, or sort before asserting — and check whether the *code* should guarantee the order |
| External | Mock at the boundary; where a real dependency is the point, make readiness an explicit wait |

Then verify: 20 runs in isolation, 20 in the full suite, both green. A flake fixed once and not re-run is a flake you hope you fixed.

## 4 — When it cannot be fixed now

Quarantine rather than retry — and quarantine with a deadline, because a quarantine with no owner is a deletion with extra steps:

1. Move the test out of the blocking suite using the runner's own mechanism, with a comment naming the issue
2. Open an issue: the failure rate, the log from a failing run, what you ruled out, and the suspected cause
3. Record it in the flake register — `docs/agent/flakes.md` — with the date and owner
4. Flag it in the PR

Quarantining is a stop-gap. Three quarantined tests in one area is a signal about that area's design, and the register is what makes the pattern visible.

## Guardrails

Read `agentic-guardrails`. The pressure here is always toward the shortcut, so the positive form of each:

- **The retry count stays at zero.** Retries convert a visible flake into an invisible one and leave the bug in place.
- **A flaky test is deleted only after establishing that the behaviour it covers is covered elsewhere** — and that check is written down.
- **`waitFor` waits for a condition.** A longer fixed timeout makes the flake rarer and harder to diagnose, which is worse than leaving it as it was.
- **A flake in production code is a race condition.** Roughly a third of them are: the test is correct and the code is genuinely non-deterministic. Rule this out before touching the test — fixing the test would delete the evidence.

## Done when

The flakiness is confirmed with a recorded failure rate, isolation versus suite behaviour is established, the cause is named from the five, and the test is either fixed and verified over 20 isolated plus 20 suite runs, or quarantined with an issue, a register entry and an owner.
