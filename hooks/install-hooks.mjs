#!/usr/bin/env node
// Installs the guardrail hooks into a target repo: copies the scripts to
// <target>/.claude/hooks/ and merges the hook config into <target>/.claude/settings.json.
//
//   node hooks/install-hooks.mjs <target-repo> [--local] [--permissions] [--dry-run]
//
// --local writes .claude/settings.local.json (personal, gitignored) instead of
// .claude/settings.json (team-wide, committed).
// --permissions also merges settings/permissions.json — the allowlist that lets an
// unattended run proceed without bypassing permissions wholesale. See settings/README.md.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const target = resolve(args.find((a) => !a.startsWith("--")) || process.cwd());
const local = args.includes("--local");
const dryRun = args.includes("--dry-run");
const withPermissions = args.includes("--permissions");

if (!existsSync(target)) {
  console.error(`Target does not exist: ${target}`);
  process.exit(1);
}

const HOOK = (script) => ({
  type: "command",
  command: "node",
  // Exec form: no shell, so paths with spaces need no quoting on any platform.
  args: ["${CLAUDE_PROJECT_DIR}/.claude/hooks/" + script],
  timeout: 10,
});

const CONFIG = {
  PreToolUse: [
    { matcher: "Bash", hooks: [HOOK("block-dangerous.mjs")] },
    { matcher: "Write|Edit", hooks: [HOOK("guard-paths.mjs")] },
  ],
  PostToolUse: [{ matcher: "Write|Edit", hooks: [HOOK("check-shortcuts.mjs")] }],
  Stop: [{ hooks: [HOOK("require-evidence.mjs")] }],
};

// --- copy scripts -----------------------------------------------------------
const hooksDir = join(target, ".claude", "hooks");
const scripts = readdirSync(here).filter((f) => f.endsWith(".mjs") && f !== "install-hooks.mjs");

if (!dryRun) mkdirSync(hooksDir, { recursive: true });
for (const s of scripts) {
  if (!dryRun) copyFileSync(join(here, s), join(hooksDir, s));
  console.log(`  ${dryRun ? "would copy" : "copied"}  ${s}`);
}

// --- merge settings ---------------------------------------------------------
const settingsPath = join(target, ".claude", local ? "settings.local.json" : "settings.json");
let settings = {};
if (existsSync(settingsPath)) {
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch (e) {
    console.error(`\n${settingsPath} is not valid JSON — fix it first; a malformed settings file disables every setting in it.`);
    process.exit(1);
  }
}

settings.hooks ||= {};
let added = 0;
let skipped = 0;

for (const [event, entries] of Object.entries(CONFIG)) {
  settings.hooks[event] ||= [];
  for (const entry of entries) {
    const script = entry.hooks[0].args[0];
    const already = settings.hooks[event].some((e) =>
      (e.hooks || []).some((h) => JSON.stringify(h.args || h.command || "").includes(script.split("/").pop()))
    );
    if (already) {
      console.log(`  skip     ${event}${entry.matcher ? ` (${entry.matcher})` : ""} — already configured`);
      skipped++;
      continue;
    }
    settings.hooks[event].push(entry);
    console.log(`  ${dryRun ? "would add" : "added"}   ${event}${entry.matcher ? ` (${entry.matcher})` : ""}`);
    added++;
  }
}

// --- merge the permission allowlist -----------------------------------------
let permsAdded = 0;
if (withPermissions) {
  const tpl = JSON.parse(readFileSync(join(here, "..", "settings", "permissions.json"), "utf8"));
  settings.permissions ||= {};
  for (const list of ["allow", "deny"]) {
    settings.permissions[list] ||= [];
    for (const rule of tpl.permissions[list]) {
      if (settings.permissions[list].includes(rule)) continue;
      settings.permissions[list].push(rule);
      permsAdded++;
    }
  }
  console.log(`  ${dryRun ? "would add" : "added"}   ${permsAdded} permission rule(s)`);
}

if (!dryRun && (added > 0 || permsAdded > 0)) {
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
}

// --- gitignore the run state ------------------------------------------------
const giPath = join(target, ".gitignore");
const needed = [".agent/", local ? ".claude/settings.local.json" : null].filter(Boolean);
if (!dryRun && existsSync(giPath)) {
  const gi = readFileSync(giPath, "utf8");
  const add = needed.filter((n) => !gi.split(/\r?\n/).some((l) => l.trim() === n));
  if (add.length) {
    writeFileSync(giPath, gi.replace(/\s*$/, "\n") + add.join("\n") + "\n", "utf8");
    console.log(`  gitignore  += ${add.join(", ")}`);
  }
}

console.log(`\n${added} hook(s) added, ${skipped} already present -> ${settingsPath}`);
if (added > 0 && !dryRun) {
  console.log("Open /hooks once (or restart Claude Code) so the new config is picked up.");
}
