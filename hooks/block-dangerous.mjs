#!/usr/bin/env node
// PreToolUse / Bash — blocks commands that are destructive or outward-facing.
// The agent may not undo work it cannot restore, and may not publish without a human.
import { readPayload, preDecision, allow } from "./_lib.mjs";

const RULES = [
  // Outward-facing: publishing is the human's call, always.
  [/\bgit\s+push\b/, "Pushing is outward-facing. Ask the human, or hand over with pr-package and let them push."],
  [/\bnpm\s+publish\b|\b(pnpm|yarn)\s+publish\b/, "Publishing a package is irreversible. This needs a human."],

  // Destroys work that cannot be recovered from the object database.
  [/\bgit\s+reset\s+(--hard|--merge)\b/, "git reset --hard discards uncommitted work. Use `git stash` or commit first."],
  [/\bgit\s+clean\s+-[a-z]*f/, "git clean -f deletes untracked files permanently. Review with `git clean -n` and delete named files instead."],
  [/\bgit\s+checkout\s+(--\s+)?\.(\s|$)/, "This discards every uncommitted change. Revert the specific file instead."],
  [/\bgit\s+restore\s+(--\s+)?\.(\s|$)/, "This discards every uncommitted change. Restore the specific file instead."],
  [/\bgit\s+branch\s+-D\b/, "Force-deleting a branch loses unmerged commits. Use -d, which refuses when work would be lost."],
  [/\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/, "Recursive force delete. Remove named paths instead."],
  [/\bgit\s+filter-branch\b|\bgit\s+reflog\s+expire\b/, "This rewrites history irreversibly. This needs a human."],

  // Moving past an error rather than diagnosing it — see agentic-guardrails.
  [/--legacy-peer-deps\b/, "A peer conflict that only resolves by overriding it changes what gets installed. Stop and hand back."],
  [/\b(npm|pnpm|yarn)\s+install\b[^\n]*\s--force\b/, "Forcing an install hides the real conflict. Diagnose it."],
];

const p = await readPayload();
const cmd = p?.tool_input?.command;
if (typeof cmd !== "string" || !cmd.trim()) allow();

for (const [pattern, reason] of RULES) {
  if (pattern.test(cmd)) {
    preDecision("deny", `Blocked by guardrail-hooks: ${reason}`);
  }
}

allow();
