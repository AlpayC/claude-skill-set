---
name: guardrail-hooks
description: Installs and maintains the hooks that make the guardrails deterministic — blocking destructive commands, protecting generated files, enforcing the blast radius, catching shortcuts, refusing to end a run without evidence. Run it when setting up a repo for unattended work, or when a rule keeps being ignored.
---

# Guardrail hooks

Everything in the context window is a suggestion. Compliance drops as a session grows — which is exactly the condition unattended work creates. For the rules that must not be optional, prose is the wrong instrument.

`agentic-guardrails` says *why* each rule exists and what the right answer is. These hooks make four of them mechanical. Both are needed: a hook that blocks without explaining teaches nothing, and prose that explains without blocking holds only while attention lasts.

## What is installed

| Hook | Event | Enforces |
|---|---|---|
| `block-dangerous.mjs` | PreToolUse / Bash | No pushing or publishing without a human; no `reset --hard`, `clean -f`, `branch -D`, `checkout .`, `rm -rf`; no `--force` or `--legacy-peer-deps` to move past an error |
| `guard-paths.mjs` | PreToolUse / Write, Edit | `.env` and generated output are never hand-edited; writes outside the spec's blast radius go to the human |
| `check-shortcuts.mjs` | PostToolUse / Write, Edit | `any`, `@ts-ignore`, bare `@ts-expect-error`, `eslint-disable`, `.skip`, `.only`, test retries — reported back with the real fix |
| `require-evidence.mjs` | Stop | A run marked running does not end without `gates.md` and a ledger |

The Stop hook blocks **once** per run. It says what is missing; stopping again is allowed. A guardrail that can trap a session is worse than none, because the next person disables the whole set.

## Install

```bash
node hooks/install-hooks.mjs <repo>            # team-wide, .claude/settings.json
node hooks/install-hooks.mjs <repo> --local    # personal, .claude/settings.local.json
node hooks/install-hooks.mjs <repo> --dry-run  # show what would change
```

It copies the scripts to `<repo>/.claude/hooks/`, merges the config into the settings file without touching what is already there, and adds `.agent/` to `.gitignore`. Running it twice adds nothing — it detects what is already configured.

Node is the only requirement, and the hooks are invoked in exec form (`command: "node"`, `args: [...]`), so no shell parses the path. Same behaviour on Windows, macOS and Linux.

**After installing, open `/hooks` once or restart** — the settings watcher only follows directories that had a settings file when the session started.

## The run state file

Two hooks read `.agent/current-run.json`, which `implement-spec` writes when a run begins:

```json
{
  "id": "ORD-412",
  "spec": "docs/specs/ORD-412.md",
  "allow": ["apps/orders/src/app/features/checkout/**", "libs/domain/orders/src/**"],
  "status": "running"
}
```

`allow` is the blast radius from the spec — a write outside it becomes a question for the human instead of a silent decision. `status` becomes `stopped` when a run is deliberately parked, which releases the Stop hook.

Without this file the hooks still apply their static rules. The blast radius is simply not enforced, because nothing declared one.

## Tuning them

The rules are lists at the top of each script, written to be edited. Two directions:

**Too loud.** A rule firing on legitimate work costs more than it saves — a hook people work around is a hook that has stopped protecting anything. Narrow the pattern, or add the path to that rule's exemptions. Record why in the repo's `CLAUDE.md`, so the next person does not restore it.

**Too quiet.** A rule from `agentic-guardrails` that keeps being ignored belongs here. Add it to the matching script, then verify it (below) — and check whether the prose version needs sharpening too, because a rule ignored is often a rule badly worded.

## Verifying a change

An unverified hook is the worst of both worlds: it looks like protection and provides none. Pipe a payload at the script directly:

```bash
echo '{"tool_input":{"command":"git push origin main"}}' | node .claude/hooks/block-dangerous.mjs
echo '{"tool_input":{"file_path":"apps/x/.env"}}'        | node .claude/hooks/guard-paths.mjs
```

Check **both** directions every time: the case that should be blocked prints a decision, and a legitimate case prints nothing and exits 0. Testing only the block half is how a hook that rejects everything gets shipped.

## What stays prose

Not everything belongs in a hook. A pattern that needs judgement — is this `any` the narrow, ledgered exception or the lazy one? — cannot be decided by a regex, and forcing it into one produces false positives that erode trust in every other rule.

Hooks carry the rules with a **mechanical test**: this path, this command, this token. Everything else stays in `agentic-guardrails`, where the reasoning lives.

## Done when

The scripts are in `<repo>/.claude/hooks/`, the settings file carries all four entries alongside whatever it already had, `.agent/` is gitignored, `/hooks` has been opened or the session restarted, and every rule you added or changed has been piped both a blocking and a passing payload.
