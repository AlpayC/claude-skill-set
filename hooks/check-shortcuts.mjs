#!/usr/bin/env node
// PostToolUse / Write|Edit — catches the shortcuts that turn a red gate green
// without touching the defect. See agentic-guardrails, "Green means green".
// Blocks with a reason the model reads, rather than silently editing the file.
import { readPayload, postBlock, allow, relToProject, matchesAny } from "./_lib.mjs";

const SOURCE = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mts", "**/*.cts", "**/*.vue", "**/*.svelte"];
const EXEMPT = ["**/*.d.ts", "**/node_modules/**", "**/dist/**", "**/*.generated.*", "**/generated/**"];

const RULES = [
  [/@ts-ignore/, "@ts-ignore", "Narrow the type with a guard, or model what the value actually is."],
  [/@ts-expect-error(?!\s*--\s*\S)/, "@ts-expect-error without an explanation",
    "Where it is genuinely right, write the reason on the same line: `@ts-expect-error -- upstream type is wrong, see ADR 0012`."],
  [/\beslint-disable(-next-line|-line)?\b/, "eslint-disable", "Fix what the rule flags."],
  [/:\s*any\b|<any>|\bas\s+any\b|\bArray<any>|\bPromise<any>/, "`any`",
    "Model the real type. Where the shape is genuinely unknown, `unknown` plus a narrowing guard keeps the check."],
  [/\b(it|test|describe)\s*\.\s*skip\s*\(|\bx(it|describe)\s*\(/, "a skipped test",
    "Fix the code, or fix the test's wrong assumption and write a ledger entry saying which."],
  [/\b(it|test|describe)\s*\.\s*only\s*\(|\bf(it|describe)\s*\(/, "a focused test",
    "`.only` silently skips the rest of the suite in CI. Remove it before handover."],
  [/\bjest\s*\.\s*retryTimes\s*\(|\bretries\s*:\s*[1-9]/, "a test retry",
    "A retry converts a visible flake into an invisible one. Hand it to flaky-triage."],
];

const p = await readPayload();
const file = p?.tool_input?.file_path;
if (typeof file !== "string" || !file) allow();

const rel = relToProject(file);
if (!matchesAny(rel, SOURCE) || matchesAny(rel, EXEMPT)) allow();

// Write carries the whole file; Edit carries only what was inserted. Checking the
// inserted text keeps pre-existing debt from being reported on every unrelated edit.
const written = p?.tool_input?.new_string ?? p?.tool_input?.content ?? "";
if (!written) allow();

const found = [];
for (const [pattern, label, fix] of RULES) {
  if (pattern.test(written)) found.push(`- ${label} — ${fix}`);
}

if (found.length) {
  postBlock(
    `guardrail-hooks found shortcuts just written to ${rel}:\n${found.join("\n")}\n\n` +
      `Make the code satisfy the check. Where one of these is genuinely the right answer, ` +
      `keep it narrow and record it in the assumption ledger with the reason.`
  );
}

allow();
