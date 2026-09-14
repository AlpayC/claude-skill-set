# Security

## What this repo can do to a machine

This is not inert documentation. Installing it writes to `~/.claude` (or a target repo's
`.claude`), and two parts of it change what an agent is allowed to do without asking:

- `hooks/` — Node hooks that run on the agent's tool calls in whichever repo they are
  installed into. `hooks/install-hooks.mjs` merges them into that repo's `settings.json`.
- `settings/permissions.json` — an allowlist that lets an unattended run proceed without a
  prompt. Its scope, and what is deliberately left out of it, is documented in
  `settings/README.md`.

Read both before installing them into a repo you care about. `--dry-run` shows the merge
without writing it.

## Reporting a vulnerability

Report privately through GitHub's
[security advisories](https://github.com/AlpayC/claude-skill-set/security/advisories/new)
rather than opening an issue.

Worth reporting: a hook that can be made to pass a call it should block, a path escaping
the blast radius `guard-paths` enforces, an allowlist entry whose misuse is not locally
reversible, or anything in `install.ps1` or `install-hooks.mjs` that writes outside the
target it was given.

Please include the command, the settings the hooks were installed with, and what got
through. A proof of concept that is destructive is not needed — showing that the check was
bypassed is enough.
