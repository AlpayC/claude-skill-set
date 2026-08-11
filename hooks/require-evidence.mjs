#!/usr/bin/env node
// Stop — an active run does not end without its evidence. Turns the evidence rule
// in agentic-guardrails from a request into a condition.
//
// Blocks at most once per run, so a session can always be ended: the second stop
// passes, having told the model what is missing.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readPayload, emit, allow, projectDir, currentRun } from "./_lib.mjs";

await readPayload();

const run = currentRun();
if (!run?.id) allow();
if (run.status && run.status !== "running") allow(); // handed over, or deliberately parked

const root = projectDir();
const evidenceDir = join(root, ".agent", "evidence", run.id);
const missing = [];

if (!existsSync(join(evidenceDir, "gates.md"))) missing.push("`.agent/evidence/<id>/gates.md` — run green-gate");
const ledger = join(root, "docs", "specs", `${run.id}.assumptions.md`);
if (!existsSync(ledger)) missing.push(`\`docs/specs/${run.id}.assumptions.md\` — the assumption ledger, even if empty`);

if (!missing.length) allow();

// One nag per run. Without this, blocking the Stop event traps the session.
const marker = join(root, ".agent", `.stop-checked-${run.id}`);
if (existsSync(marker)) {
  try {
    if (readFileSync(marker, "utf8").trim() === String(run.id)) allow();
  } catch {
    allow();
  }
}
try {
  mkdirSync(join(root, ".agent"), { recursive: true });
  writeFileSync(marker, String(run.id));
} catch {
  allow(); // cannot record the nag, so do not risk trapping the session
}

emit({
  decision: "block",
  reason:
    `Run ${run.id} is still marked running and has no evidence:\n` +
    missing.map((m) => `- ${m}`).join("\n") +
    `\n\nFinish it: green-gate, then visual-verify for anything user-visible, then pr-package. ` +
    `If you are stopping deliberately, write the handover with session-handoff and set "status" in ` +
    `.agent/current-run.json to "stopped". Stopping again without doing either will be allowed.`,
});
