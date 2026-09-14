# Contributing

This repo is a set of skills — process documents an agent reads, not an application. The
review question is therefore never "does it compile" but **"will it fire, and will it be
followed to the end?"**

## Before you commit

```bash
node tools/check.mjs
```

Errors mean a skill is broken or will not load; they fail CI. Warnings mean it loads but
probably will not fire, or will not be followed to the end — the two failure modes that
stay invisible until a real run hits them. Read them even though they pass.

CI runs the same check on every push and pull request, plus a parse check over `hooks/`,
`tools/` and `install.ps1`.

## Writing or changing a skill

`skills/skill-forge/SKILL.md` is the house style, and it is the source of truth over
anything summarised here. The short version:

- **Name the failure mode first.** A skill exists because something went wrong twice. Say
  what, at the top.
- **Lead the `description` with the situation, not the artefact.** "Maintains
  `docs/agent/repo-map.md`" answers a question the agent is not asking. "Run it when you
  land in a repo that has no map" answers the one it is.
- **Say when to reach for it.** The description needs a trigger phrase — the check warns
  when it has none.
- **Bound the work.** A skill with numbered steps needs a `## Done when` section, or
  nothing tells the agent it has finished.
- **Positive phrasing over prohibitions.** "Take the command from `repo-map.md`" beats
  "do not hardcode commands".
- **One source of truth per rule.** The ledger, repair budget, stop conditions and evidence
  rules live in `agentic-guardrails` only. Everywhere else references them by name.
- **Commands come from the environment**, read out of `docs/agent/repo-map.md`, never
  hardcoded to one workspace tool.

## Model-invoked or hand-invoked

Eleven skills fire on their own; everything else is `user-invocable-only` and typed as
`/its-name`. A new skill starts hand-invoked. It earns model invocation by being typed two
or three times in real work — not by being written.

Know the consequence before you promote or demote: a hand-invoked skill cannot be reached
by another skill, so a chain step that would hand work to it will report instead of act.

## Commit messages

Say what changed and why it was wrong before. The commit log here is the reasoning record
for a set of documents that otherwise carry no history.

## Pull requests

The template asks three things: what failure mode this addresses, the output of
`node tools/check.mjs`, and — for a skill change — whether it was run against a real repo.
The last one matters most. A skill that has never fired against real code is a draft.
