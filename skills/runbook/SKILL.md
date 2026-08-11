---
name: runbook
description: Writes the operational document for a project — how to run it locally, its preconditions, how to reach a given state, how to debug it, the failure modes newcomers hit first — every command verified by running it. Use it when setup takes too long, or an agent must start an app it never has.
---

# Runbook

A runbook is what lets an unattended run get the app to a state where it can verify anything. `visual-verify` cannot screenshot a login screen it does not know how to get past.

The rule that separates a runbook from a wish list: **every command in it has been executed from a clean state and observed to work**. An unverified runbook is worse than none, because it costs the reader the time to discover it is wrong.

## What to cover

**Preconditions.** Runtime versions, package manager, environment variables and where their values come from, required services (mock backend, database, auth stub), VPN or network access, credentials and who issues them. Name each precondition and how to check it is satisfied — a check is what turns "make sure X is running" into something an agent can act on.

**First run from clean.** The literal sequence from a fresh clone to a working app. Actually do it: `git clone` into a temp directory and follow your own instructions. Every step you had to improvise is a step the document was missing.

**Reaching states.** How to log in, and as which roles. How to seed or reach test data. How to toggle a feature flag. How to point at a different backend environment. This section is the one agentic verification depends on most and the one runbooks most often omit.

**Debugging.** Where the logs are, how to raise verbosity, how to attach a debugger, how to inspect the store or query cache, how to intercept requests.

**Failure modes.** The five things that go wrong first, each as symptom → cause → fix:

```markdown
### Blank page, console shows a CORS error
Cause: the dev proxy is not running; the app is calling the real API directly.
Fix: `npm run mock-api` in a second terminal, then reload.
Check: `curl -s localhost:4010/health` returns 200.
```

Symptom first. The reader is searching by what they see, not by what is wrong — they do not yet know what is wrong.

## Verify by running

Run every command in the document, from a clean state, in order. Record what each produced.

Where a step cannot be verified from here — it needs production credentials, or a machine you do not have — mark it explicitly as unverified with what would confirm it. An honestly marked gap is usable; a confident wrong instruction is not.

## Where it lives

`<project>/RUNBOOK.md`, linked from the project's `CLAUDE.md` so an agent hits it before trying to start the app by guessing. Where a step is a precondition an agent will keep tripping over, put the one-line version directly in `CLAUDE.md` too — that is the rare case where duplication pays, because the runbook is a click away and the failure is immediate.

## Done when

Every command has been run from a clean clone and its output recorded, every precondition has a check command, the state-reaching section covers login and test data, at least the five most common failure modes are documented symptom-first, unverifiable steps are marked as such, and the project's `CLAUDE.md` links to it.
