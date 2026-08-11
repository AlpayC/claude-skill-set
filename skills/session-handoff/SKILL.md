---
name: session-handoff
description: Writes the note that lets work continue across a compaction, a new session, or a different person — only what the artefacts do not already hold, plus the protocol for verifying the state before continuing. Run it when context is running low, when stopping mid-task, or when handing over.
---

# Session handoff

Most of the state already survives. The spec says what is being built, the ledger says what was decided, `gates.md` says what passed, the commits say what landed, and `git status` says what is half-written. A handoff that restates any of that is a copy that will disagree with the original within a day.

So the note holds one thing: **what is only in your head right now.**

## When to write it

**At a green commit, not mid-red.** A handoff pointing at a broken working tree forces the next session to reconstruct what was in flight before it can do anything, which is the situation the note was supposed to prevent. Where stopping green is impossible, say so explicitly and in the first line.

**Before the context is exhausted, not after.** Once compaction has happened, the details worth recording are the ones already gone. Write it while the run is still holding what it knows.

## What goes in

```markdown
# Handoff — <spec or epic id>
Written: <ISO> · Branch: <name> · Last commit: <sha> · Tree: clean | dirty

## Wo ich stehe
<Which step of the spec, and what state it is in. One paragraph.>

## Was ich zuletzt versucht habe
<The last change and what it showed — especially if it did not work.
This is the single most valuable line in the document.>

## Aktuelle Hypothese
<What you currently believe is true about the problem, and how confident you are.>

## Schon ausgeschlossen
<What you tested and ruled out, with what showed it.
Without this, the next session repeats your first two hours.>

## Nächster Schritt
<What you would do next, and why that rather than the alternative.>

## Halbfertiges im Arbeitsbaum
<Uncommitted changes and what each was for. Anything intentionally left broken.>

## Zeiger
Spec: docs/specs/<id>.md · Ledger: docs/specs/<id>.assumptions.md
Evidence: .agent/evidence/<id>/ · Map: docs/agent/repo-map.md
<Never the contents — only the paths.>
```

**Schon ausgeschlossen** is the section that earns the document. A fresh session has no way to know which paths are dead, so without it, it walks the most obvious one — which is usually the one you already walked.

Redact anything sensitive. Tokens, credentials and personal data have a way of ending up in a paste of an error message.

## Where it goes

`.agent/handoff/<id>-<timestamp>.md`, so previous handoffs stay readable. A long epic accumulates a trail of them, and the trail is often more useful than any single note.

## Resuming from one

A handoff describes the world at the moment it was written, and the working tree may have moved since. **Verify before continuing** — three checks, in this order:

1. **The tree matches.** `git status` and `git log -1`. A different branch, extra commits or unexpected dirt means the note is stale; trust the repository, not the note, and say in your first message that they disagreed.
2. **The gate still holds.** Run `green-gate` on the changed set before adding anything. Continuing on top of a red state you did not create wastes the session on someone else's failure.
3. **The artefacts, in order.** Spec, then ledger, then the handoff. That order matters: the spec is the contract, the ledger is the accumulated decisions, and the handoff is one session's opinion about where things stand. Reading the opinion first colours how you read the contract.

Then continue from **Nächster Schritt** — and where the verification contradicted the note, say so before doing anything, rather than quietly working around it.

## Done when

The note is written at a green commit or explicitly flags that it is not, it holds no content the spec, ledger, evidence or commits already hold, the ruled-out list is populated, the pointer section carries paths rather than copies, and anything sensitive is redacted.
