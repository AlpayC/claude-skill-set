// Shared helpers for the guardrail hooks. No dependencies — these run on every tool call.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/** Read the hook payload from stdin. Returns {} if stdin is empty or malformed. */
export async function readPayload() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** The repo root, as Claude Code reports it. Falls back to cwd. */
export function projectDir() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

/** Emit a hook result and exit 0. Exit code 0 + JSON is the documented control path. */
export function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

/** Allow the tool call through without saying anything. */
export function allow() {
  process.exit(0);
}

/** PreToolUse: deny (hard block) or ask (hand the decision to the human). */
export function preDecision(decision, reason) {
  emit({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  });
}

/** PostToolUse: feed a correction back to the model without ending the turn. */
export function postBlock(reason) {
  emit({ decision: "block", reason });
}

/** Glob → RegExp. Supports **, *, ? and a leading **&#47;. Paths are compared with forward slashes. */
export function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // ** spans directory separators; **/ also matches zero directories
        if (glob[i + 2] === "/") {
          out += "(?:.*/)?";
          i += 2;
        } else {
          out += ".*";
          i += 1;
        }
      } else {
        out += "[^/]*";
      }
    } else if (c === "?") {
      out += "[^/]";
    } else if ("\\^$+.()|{}[]".includes(c)) {
      out += "\\" + c;
    } else {
      out += c;
    }
  }
  return new RegExp("^" + out + "$", "i");
}

export function matchesAny(path, globs) {
  const p = norm(path);
  return globs.some((g) => globToRegExp(norm(g)).test(p));
}

export function norm(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

/** Path relative to the repo root, forward-slashed. Absolute paths outside the repo stay absolute. */
export function relToProject(filePath) {
  const root = norm(projectDir()).replace(/\/$/, "");
  const p = norm(filePath);
  return p.toLowerCase().startsWith(root.toLowerCase() + "/")
    ? p.slice(root.length + 1)
    : p;
}

/**
 * The active run, written by implement-spec at .agent/current-run.json:
 *   { "id": "ORD-412", "spec": "docs/specs/ORD-412.md", "allow": ["apps/orders/**"], "status": "running" }
 * Returns null when no run is active — hooks then apply only their static rules.
 */
export function currentRun() {
  const f = join(projectDir(), ".agent", "current-run.json");
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}
