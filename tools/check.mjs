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
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = join(ROOT, "skills");
const quiet = process.argv.includes("--quiet");

/**
 * A skill's frontmatter says whether it *may* fire; settings say whether it currently does.
 * Reporting only the first gives a context-load number that is not the one being paid.
 * Precedence follows Claude Code: user, then project, then local.
 */
function skillOverrides() {
  const sources = [
    join(homedir(), ".claude", "settings.json"),
    join(process.cwd(), ".claude", "settings.json"),
    join(process.cwd(), ".claude", "settings.local.json"),
  ];
  const merged = {};
  const seen = [];
  for (const f of sources) {
    if (!existsSync(f)) continue;
    try {
      Object.assign(merged, JSON.parse(readFileSync(f, "utf8")).skillOverrides || {});
      seen.push(f.replace(homedir(), "~"));
    } catch {
      warn("settings", `${f} is not valid JSON — every setting in it is being ignored`);
    }
  }
  return { merged, seen };
}

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
  "handed-over", // a status value in current-run.json, not a skill
  "claude-in-chrome", "code-review", "security-review", // real skills, just not ours
]);

const { merged: OVERRIDES, seen: SETTINGS_SEEN } = skillOverrides();
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

  // "off" is removed entirely; "user-invocable-only" keeps /name but leaves the model's reach;
  // "name-only" stays listed without its description, so it costs a name and cannot be chosen well.
  const override = OVERRIDES[dir];
  const state =
    override === "off" ? "off"
    : userInvoked || override === "user-invocable-only" ? "library"
    : override === "name-only" ? "name-only"
    : "firing";

  meta.push({ dir, desc, userInvoked, state, refs: [] });
  const entry = meta[meta.length - 1];

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
  // Only verbs that mean "make this act". `use`, `see`, `via` and `from` introduce a
  // mention — "installed by `guardrail-hooks`", "`ui-spec`'s state matrix" — and counting
  // those as invocations buries the two references that really are handoffs.
  // The window allows words between the verb and the name ("hand a flaky failure to `x`")
  // but never crosses a sentence, so the two stay in the same clause.
  for (const m of body.matchAll(/\b(run|runs|invoke|invokes|dispatch|dispatches|hand|hands|handed|consult|consults|delegate|delegates)\b[^.\n]{0,60}?`([a-z][a-z0-9]*(?:-[a-z0-9]+){1,3})`/gi)) {
    const ref = m[2];
    if (ref === dir || KNOWN_NON_SKILLS.has(ref)) continue;
    if (!names.has(ref)) {
      warn(dir, `tells the agent to reach for \`${ref}\`, which is not a skill in this set`);
      continue;
    }
    if (!entry.refs.includes(ref)) entry.refs.push(ref);
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
// Only skills that actually fire compete for a trigger and cost context.
const model = meta.filter((m) => m.state === "firing");

// --- chain breaks ------------------------------------------------------------
// A skill outside the model's reach cannot be invoked by another skill. A firing skill
// that tells the agent to reach for one will silently do nothing at that step.
const stateOf = Object.fromEntries(meta.map((m) => [m.dir, m.state]));
for (const m of model) {
  for (const ref of m.refs) {
    if (stateOf[ref] === "firing") continue;
    if (stateOf[ref] === "off") err(m.dir, `reaches for \`${ref}\`, which settings have turned off entirely`);
    else warn(m.dir, `reaches for \`${ref}\`, which is hand-invoked — that step will report instead of act`);
  }
}
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
  const count = (s) => meta.filter((m) => m.state === s).length;
  console.log(
    `${dirs.length} skills · ${model.length} firing · ${count("library")} library (/name) · ` +
      `${count("name-only")} name-only · ${count("off")} off`,
  );
  console.log(`context load: ${load} chars (~${Math.round(load / 4)} tokens), avg ${Math.round(load / (model.length || 1))}`);
  console.log(SETTINGS_SEEN.length ? `settings read: ${SETTINGS_SEEN.join(", ")}` : "settings read: none — every skill counted as firing");
}
for (const e of errors) console.log(`  ERROR  ${e}`);
for (const w of warnings) console.log(`  warn   ${w}`);
for (const c of collisions.sort((a, b) => b.pct - a.pct))
  console.log(`  warn   ${c.pct}% description overlap: ${c.pair} — ${c.shared.slice(0, 5).join(", ")}`);

if (!errors.length && !warnings.length && !collisions.length && !quiet) console.log("clean");
process.exit(errors.length ? 1 : 0);
