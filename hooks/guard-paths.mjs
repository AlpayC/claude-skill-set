#!/usr/bin/env node
// PreToolUse / Write|Edit — protects files that must not be hand-edited, and enforces
// the spec's blast radius when a run is active.
import { readPayload, preDecision, allow, relToProject, matchesAny, currentRun } from "./_lib.mjs";

// Editing these is always wrong: the change is either lost on the next generation
// or it leaks something that must not be in the repo.
const PROTECTED = [
  { globs: ["**/.env", "**/.env.*"], except: ["**/.env.example", "**/.env.template", "**/.env.sample"],
    why: "Secrets belong in the environment, not in a file the agent writes." },
  { globs: ["**/*.generated.*", "**/generated/**", "**/__generated__/**", "**/*.g.ts", "**/*.g.dart"],
    why: "Generated output. Hand edits vanish on the next generation — change the source or the generator." },
  { globs: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**", "**/coverage/**"],
    why: "Build or dependency output. Change the input, not the artefact." },
  { globs: ["**/.git/**"], why: "Git internals. Use git commands." },
];

const p = await readPayload();
const file = p?.tool_input?.file_path;
if (typeof file !== "string" || !file) allow();

const rel = relToProject(file);

for (const rule of PROTECTED) {
  if (matchesAny(rel, rule.globs) && !matchesAny(rel, rule.except || [])) {
    preDecision("deny", `Blocked by guardrail-hooks: ${rel} — ${rule.why}`);
  }
}

// Blast radius: the spec named the paths this run may change. Outside them is a
// spec-level decision, so it goes to the human rather than being decided silently.
const run = currentRun();
if (run?.allow?.length && !matchesAny(rel, run.allow)) {
  preDecision(
    "ask",
    `${rel} is outside the blast radius of ${run.id}.\n` +
      `Spec allows: ${run.allow.join(", ")}\n` +
      `Per agentic-guardrails this is either a shared-project change worth a ledger entry and a PR flag, ` +
      `or the feature is larger than the spec assumed — in which case stop and hand back with the corrected scope.`
  );
}

allow();
