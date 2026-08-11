#!/usr/bin/env node
/**
 * Validates the skill set. Run it before committing a skill change, and in CI.
 *
 *   node tools/check.mjs [--quiet]
 *
 * Errors exit 1 and mean the skill is broken or will not load. Warnings exit 0 and mean
 * it will load but probably will not fire, or will not be followed to the end — the two
 * failure modes that are invisible until a real run hits them.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = join(ROOT, "skills");
const quiet = process.argv.includes("--quiet");

const errors = [];
const warnings = [];
const err = (s, m) => errors.push(`${s}: ${m}`);
const warn = (s, m) => warnings.push(`${s}: ${m}`);

// A description opening with the file it produces answers "what does this write",
// when the agent is asking "does this apply to my situation". repo-cartograph did not
// fire on a plain question about a repo for exactly this reason.
const ARTEFACT_LEAD = /^(maintains|builds|writes|creates|generates|produces|assembles|records|updates)\b/i;
const PATH_IN_LEAD = /(docs\/|\.md\b|\.json\b|\/\*\*)/;

// Without one of these the description states what the skill is and never when to reach for it.
const TRIGGER = /\b(run it|use it|use when|run when|invoke it|read it|reach for it|build it|consult it)\b/i;

// Kebab-case terms in backticks that look like skill names but are not — extend as needed.
const KNOWN_NON_SKILLS = new Set([
  "package-json", "tsconfig-json", "no-explicit-any", "ts-ignore", "ts-expect-error",
  "eslint-disable", "no-restricted-imports", "enforce-module-boundaries", "changed-set",
  "blast-radius", "current-run", "pre-commit", "read-only", "fail-closed", "de-de",
  "how-do-we-do-x-here", "test-first", "red-green-refactor", "no-ff", "strict-port",
]);

const dirs = readdirSync(SKILLS).filter((d) => statSync(join(SKILLS, d)).isDirectory());
const names = new Set(dirs);
const meta = [];

for (const dir of dirs) {
  const file = join(SKILLS, dir, "SKILL.md");
  if (!existsSync(file)) {
    err(dir, "no SKILL.md");
    continue;
  }
  const src = readFileSync(file, "utf8");

  // --- frontmatter -----------------------------------------------------------
  if (!src.startsWith("---\n") && !src.startsWith("---\r\n")) {
    err(dir, "does not start with a frontmatter fence");
    continue;
  }
  const end = src.indexOf("\n---", 4);
  if (end === -1) {
    err(dir, "frontmatter is not closed");
    continue;
  }
  const fm = src.slice(4, end);
  const body = src.slice(end + 4);

  const name = (fm.match(/^name:\s*(.+)$/m) || [])[1]?.trim();
  const desc = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim();
  const userInvoked = /^disable-model-invocation:\s*true\s*$/m.test(fm);

  if (!name) err(dir, "no name");
  else if (name !== dir) err(dir, `name "${name}" does not match its directory`);
  if (!desc) {
    err(dir, "no description");
    continue;
  }

  // A plain YAML scalar containing ": " breaks the parse and the skill silently vanishes.
  if (/:\s/.test(desc)) err(dir, 'description contains ": " which breaks the YAML scalar');

  meta.push({ dir, desc, userInvoked });

  // --- description quality ---------------------------------------------------
  if (userInvoked) {
    if (desc.length > 140) warn(dir, `user-invoked description is ${desc.length} chars — a human-facing one line is enough`);
  } else {
    if (desc.length > 600) warn(dir, `description is ${desc.length} chars — loaded every turn`);
    if (!TRIGGER.test(desc)) warn(dir, "description never says when to reach for it");
    const lead = desc.slice(0, 70);
    if (ARTEFACT_LEAD.test(desc) && PATH_IN_LEAD.test(lead))
      warn(dir, "description leads with the artefact it writes rather than the situation it applies to");
  }

  // --- body ------------------------------------------------------------------
  // A skill with ordered steps needs a completion bar. A pure reference — a rule set, an
  // index — has no work to bound, so demanding one there is noise.
  const hasSteps = /^##\s+\d+\s+[—-]/m.test(body) || /^##\s+(The loop|The step loop|Phase)/im.test(body);
  if (hasSteps && !/^##\s+Done when\s*$/im.test(body)) warn(dir, "has steps but no `## Done when` — nothing bounds the work");

  // --- references ------------------------------------------------------------
  // Only a backticked name preceded by an invocation verb is a claim that a skill exists.
  // Matching every kebab-case term in backticks flags libraries, CSS features and status
  // values instead, and a check that mostly cries wolf gets switched off.
  for (const m of body.matchAll(/\b(run|invoke|use|read|consult|hand(?:ed|s)? (?:it |them )?to|via|through|from|see|calls?|reaches?)\s+`([a-z][a-z0-9]*(?:-[a-z0-9]+){1,3})`/gi)) {
    const ref = m[2];
    if (names.has(ref) || ref === dir || KNOWN_NON_SKILLS.has(ref)) continue;
    warn(dir, `tells the agent to reach for \`${ref}\`, which is not a skill in this set`);
  }

  // --- disclosed reference files exist ---------------------------------------
  for (const m of body.matchAll(/\[`?([A-Z0-9-]+\.md)`?\]\(([^)]+)\)/g)) {
    const target = join(SKILLS, dir, m[2]);
    if (!existsSync(target)) err(dir, `points at ${m[2]} which does not exist`);
  }
}

// --- collisions --------------------------------------------------------------
const STOP = new Set(
  "the a an and or of to in it for with when run this that is are as on from into which what does not every each all its their them you your by at before after so but they have has was were will would can could".split(" "),
);
const terms = (s) => new Set((s.toLowerCase().match(/[a-zäöüß-]{4,}/g) || []).filter((w) => !STOP.has(w)));
const model = meta.filter((m) => !m.userInvoked);
const collisions = [];
for (let i = 0; i < model.length; i++) {
  for (let j = i + 1; j < model.length; j++) {
    const a = terms(model[i].desc);
    const b = terms(model[j].desc);
    const shared = [...a].filter((x) => b.has(x));
    const jac = shared.length / new Set([...a, ...b]).size;
    if (jac > 0.15) collisions.push({ pair: `${model[i].dir} ↔ ${model[j].dir}`, pct: Math.round(jac * 100), shared });
  }
}

// --- report ------------------------------------------------------------------
const load = model.reduce((n, m) => n + m.desc.length, 0);

if (!quiet) {
  console.log(`${dirs.length} skills · ${model.length} model-invoked · ${meta.length - model.length} user-invoked`);
  console.log(`context load: ${load} chars (~${Math.round(load / 4)} tokens), avg ${Math.round(load / model.length)}`);
}
for (const e of errors) console.log(`  ERROR  ${e}`);
for (const w of warnings) console.log(`  warn   ${w}`);
for (const c of collisions.sort((a, b) => b.pct - a.pct))
  console.log(`  warn   ${c.pct}% description overlap: ${c.pair} — ${c.shared.slice(0, 5).join(", ")}`);

if (!errors.length && !warnings.length && !collisions.length && !quiet) console.log("clean");
process.exit(errors.length ? 1 : 0);
