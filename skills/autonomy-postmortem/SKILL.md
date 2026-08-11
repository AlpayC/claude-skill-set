---
name: autonomy-postmortem
description: Runs after any agentic run that needed a human mid-implementation — classifies the cause as missing context, thin spec, weak guardrail or genuine judgement, and lands the fix where it prevents a recurrence. Use it whenever a run stalled, went wrong, or had to be taken over.
---

# Autonomy postmortem

Every interruption is a defect in the setup, not a fact of life. Treated one at a time, they get resolved and forgotten; treated as postmortems, each one permanently removes a class of interruption.

The failure mode this guards against is answering the question and moving on. The answer unblocks one run; the postmortem unblocks every future one.

Blameless in the ordinary sense, and specifically: the agent's behaviour is a symptom. "The agent should have known" is not a finding — the finding is which document should have told it.

## 1 — Establish what happened

- Where in the run did it stop, and what was the exact question or wrong output?
- What did the agent already have available — spec, map, `CLAUDE.md`, glossary, contract?
- What did it need that it did not have?
- What did the human supply that unblocked it?

That last answer is the raw material. Whatever the human said is, almost always, what should have been written down before the run started.

## 2 — Classify

The class determines where the fix lands, and a fix in the wrong place does not prevent the recurrence:

| Class | Signature | Fix lands in |
|---|---|---|
| **Missing context** | The human answered with a fact about the codebase or the team's conventions | `CLAUDE.md` via `context-baseline`, or `docs/agent/wiki/` via `dev-wiki` |
| **Thin spec** | The human made a product or design decision | `spec-forge` — usually a dimension `grill-spec` should have asked about |
| **Weak guardrail** | The agent asked instead of ledgering, or took a shortcut, or ground past its repair budget | `agentic-guardrails`, or the skill that governs that step |
| **Stale map** | The agent used a command, path or stack fact that was no longer true | `repo-cartograph`, plus whatever let the map go stale |
| **Genuine judgement** | Irreversible, needs a credential, or genuinely a human's call | Nothing. Confirm the stop condition fired correctly — this is the system working. |

Most interruptions land in the first two. When several land in **weak guardrail**, that is the more serious finding: the guardrails are being read and not followed, which is a wording problem in the skill rather than a knowledge problem in the repo.

## 3 — Land the fix

The fix is a **file edit**, not a resolution. Nothing here is complete until something is written that would have prevented the interruption.

Then check the same fix against the neighbours: a convention missing from one app's context file is usually missing from the other four.

## 4 — Track the trend

`docs/agent/autonomy-log.md`, one line per postmortem:

```markdown
| Date | Run | Class | What was missing | Fix landed in |
|------|-----|-------|------------------|---------------|
| 2026-08-11 | ORD-412 | Missing context | Facade pattern is mandatory for store access | apps/orders/CLAUDE.md |
```

The log is what turns individual fixes into a signal. Read it every dozen entries and look for the pattern:

- One class dominating → that part of the setup is the weak one
- The same area recurring → that area needs a wiki page or an ADR, not another one-line fix
- The rate not falling → the fixes are landing somewhere the agent does not read, which is itself the finding

## Done when

The interruption is classified, a concrete file edit has landed that would have prevented it, the neighbouring projects have been checked for the same gap, and the log has its line.
