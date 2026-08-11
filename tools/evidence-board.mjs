#!/usr/bin/env node
/**
 * Builds a self-contained review board from the artefacts the skills produce.
 *
 *   node tools/evidence-board.mjs [repo] [--out <file>] [--open]
 *
 * Reads docs/specs/, docs/epics/, .agent/evidence/, .agent/current-run.json and
 * .agent/handoff/, and writes one HTML file with every screenshot embedded.
 *
 * The board shows gaps as loudly as results: a criterion with no evidence, a run with
 * no screenshots, a ledger entry with no reasoning. That is what a reviewer needs to
 * see first, and it is exactly what a summary would smooth over.
 */
import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { join, resolve, extname, basename } from "node:path";

const argv = process.argv.slice(2);
const repo = resolve(argv.find((a) => !a.startsWith("--")) || process.cwd());
const outArg = argv.indexOf("--out");
const out = outArg > -1 ? resolve(argv[outArg + 1]) : join(repo, ".agent", "board.html");

const p = (...s) => join(repo, ...s);
const read = (f) => (existsSync(f) ? readFileSync(f, "utf8") : null);
const ls = (d) => (existsSync(d) && statSync(d).isDirectory() ? readdirSync(d) : []);

// ---------------------------------------------------------------- collect

/** Section body from a markdown heading, up to the next heading of the same level. */
function section(md, heading) {
  if (!md) return null;
  const re = new RegExp(`^(#{2,3})\\s*${heading}\\s*$`, "im");
  const m = md.match(re);
  if (!m) return null;
  const level = m[1].length;
  const rest = md.slice(m.index + m[0].length);
  const next = rest.search(new RegExp(`^#{1,${level}}\\s`, "m"));
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

const bullets = (txt) =>
  !txt ? [] : txt.split(/\r?\n/).filter((l) => /^\s*[-*]\s+\S/.test(l)).map((l) => l.replace(/^\s*[-*]\s+/, "").trim());

function parseLedger(md) {
  if (!md) return [];
  return [...md.matchAll(/^##\s+(A\d+)\s*[—-]\s*(.+)$/gim)].map((m, i, all) => {
    const start = m.index + m[0].length;
    const end = i + 1 < all.length ? all[i + 1].index : md.length;
    const body = md.slice(start, end);
    const field = (name) => (body.match(new RegExp(`\\*\\*${name}[^*]*\\*\\*:?\\s*(.+)`, "i")) || [])[1]?.trim() || null;
    return {
      id: m[1],
      title: m[2].trim(),
      decided: field("Decided"),
      why: field("Why"),
      reversal: field("Reversal cost"),
    };
  });
}

/** gates.md is prose with command + exit code; read tolerantly and report what is unreadable. */
function parseGates(md) {
  if (!md) return { entries: [], unparsed: 0 };
  const entries = [];
  let unparsed = 0;
  for (const block of md.split(/^##\s+/m).slice(1)) {
    const name = block.split(/\r?\n/)[0].trim();
    const exit = block.match(/exit\s+(\d+)/i);
    if (!exit) unparsed++;
    entries.push({ name, exit: exit ? Number(exit[1]) : null, skipped: /\bskip(ped)?\b/i.test(block) });
  }
  return { entries, unparsed };
}

const RANK = { low: 0, niedrig: 0, medium: 1, mittel: 1, high: 2, hoch: 2 };
const rank = (r) => (r ? (RANK[r.toLowerCase().split(/[\s.,]/)[0]] ?? 1) : 1);

function collect() {
  const runState = (() => {
    try {
      return JSON.parse(read(p(".agent", "current-run.json")) || "null");
    } catch {
      return null;
    }
  })();

  const ids = new Set();
  for (const f of ls(p("docs", "specs"))) if (f.endsWith(".md") && !f.endsWith(".assumptions.md")) ids.add(f.slice(0, -3));
  for (const d of ls(p(".agent", "evidence"))) if (statSync(p(".agent", "evidence", d)).isDirectory()) ids.add(d);
  if (runState?.id) ids.add(runState.id);

  return [...ids].sort().map((id) => {
    const spec = read(p("docs", "specs", `${id}.md`));
    const evDir = p(".agent", "evidence", id);
    const gates = parseGates(read(join(evDir, "gates.md")));
    const shots = ls(evDir)
      .filter((f) => [".png", ".jpg", ".jpeg", ".webp"].includes(extname(f).toLowerCase()))
      .map((f) => ({
        name: basename(f, extname(f)),
        uri: `data:image/${extname(f).slice(1).replace("jpg", "jpeg")};base64,${readFileSync(join(evDir, f)).toString("base64")}`,
      }));
    const criteria = bullets(section(spec, "Acceptance criteria")) .concat(
      (section(spec, "Acceptance criteria") || "").split(/\r?\n/).filter((l) => /^\s*(Given|Gegeben)\b/i.test(l)).map((l) => l.trim())
    );
    const handoffs = ls(p(".agent", "handoff")).filter((f) => f.startsWith(id));

    const red = gates.entries.filter((g) => g.exit !== null && g.exit !== 0).length;
    const isCurrent = runState?.id === id;
    const status = isCurrent ? runState.status || "running" : gates.entries.length ? "handed-over" : "spec";

    return {
      id,
      title: (spec?.match(/^#\s*(.+)$/m) || [])[1]?.replace(new RegExp(`^${id}\\s*[—-]\\s*`), "") || id,
      status,
      column:
        status === "running" ? "running"
        : status === "stopped" ? "blocked"
        : gates.entries.length || shots.length ? "review"
        : "ready",
      spec: !!spec,
      allow: isCurrent ? runState.allow || [] : (section(spec, "Blast radius") || "").split(/\r?\n/).filter(Boolean).slice(0, 3),
      criteria,
      ledger: parseLedger(read(p("docs", "specs", `${id}.assumptions.md`))).sort((a, b) => rank(b.reversal) - rank(a.reversal)),
      gates: gates.entries,
      gatesUnparsed: gates.unparsed,
      red,
      shots,
      console: read(join(evDir, "console.md")),
      repro: read(join(evDir, "repro.md")),
      hypotheses: read(join(evDir, "hypotheses.md")),
      unverified: bullets(section(spec, "Unverified")),
      handoffs,
      gaps: [
        !spec && "keine Spec",
        spec && !criteria.length && "Spec ohne Akzeptanzkriterien",
        !gates.entries.length && "kein Gate-Lauf",
        red > 0 && `${red} rote${red === 1 ? "s" : ""} Gate`,
        !shots.length && "keine Screenshots",
        gates.entries.length && !read(join(evDir, "console.md")) && "Console/Network nicht erfasst",
        gates.unparsed && `${gates.unparsed} Gate-Block(s) ohne Exit-Code`,
      ].filter(Boolean),
    };
  });
}

// ---------------------------------------------------------------- render

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const COLUMNS = [
  ["ready", "Spec bereit"],
  ["running", "Läuft"],
  ["review", "Review nötig"],
  ["blocked", "Blockiert"],
];

const card = (r) => `
<article class="card" data-open="false">
  <header onclick="this.parentElement.dataset.open = this.parentElement.dataset.open === 'true' ? 'false' : 'true'">
    <div class="id">${esc(r.id)}</div>
    <h3>${esc(r.title)}</h3>
    <div class="chips">
      ${r.ledger.length ? `<span class="chip decisions">${r.ledger.length} Entscheidung${r.ledger.length === 1 ? "" : "en"}</span>` : ""}
      ${r.gates.length ? `<span class="chip ${r.red ? "bad" : "good"}">${r.red ? `${r.red} rot` : `${r.gates.length} grün`}</span>` : ""}
      ${r.shots.length ? `<span class="chip">${r.shots.length} Screenshot${r.shots.length === 1 ? "" : "s"}</span>` : ""}
    </div>
    ${r.gaps.length ? `<ul class="gaps">${r.gaps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>` : ""}
  </header>
  <div class="body">
    ${
      r.ledger.length
        ? `<section><h4>Entscheidungen für dich getroffen</h4>${r.ledger
            .map(
              (l) => `<div class="ledger r${rank(l.reversal)}">
        <b>${esc(l.id)} — ${esc(l.title)}</b>
        ${l.decided ? `<p>${esc(l.decided)}</p>` : `<p class="miss">keine Entscheidung notiert</p>`}
        ${l.why ? `<p class="why">${esc(l.why)}</p>` : `<p class="miss">keine Begründung notiert</p>`}
        <span class="rev">Rückgängig ${esc(l.reversal || "unbekannt")}</span>
      </div>`
            )
            .join("")}</section>`
        : `<section><h4>Entscheidungen</h4><p class="miss">Kein Ledger vorhanden.</p></section>`
    }
    ${
      r.criteria.length
        ? `<section><h4>Akzeptanzkriterien <span class="n">${r.criteria.length}</span></h4><ul class="crit">${r.criteria
            .map((c) => `<li>${esc(c)}</li>`)
            .join("")}</ul></section>`
        : ""
    }
    ${
      r.gates.length
        ? `<section><h4>Gates</h4><table>${r.gates
            .map(
              (g) =>
                `<tr><td>${esc(g.name)}</td><td class="${g.exit === 0 ? "good" : g.exit === null ? "miss" : "bad"}">${
                  g.skipped ? "übersprungen" : g.exit === null ? "kein Exit-Code" : `exit ${g.exit}`
                }</td></tr>`
            )
            .join("")}</table></section>`
        : ""
    }
    ${
      r.shots.length
        ? `<section><h4>Screenshots</h4><div class="shots">${r.shots
            .map((s) => `<figure><img src="${s.uri}" alt="${esc(s.name)}" loading="lazy"><figcaption>${esc(s.name)}</figcaption></figure>`)
            .join("")}</div></section>`
        : ""
    }
    ${[["Console / Network", r.console], ["Repro", r.repro], ["Hypothesen", r.hypotheses]]
      .filter(([, v]) => v)
      .map(([h, v]) => `<section><h4>${h}</h4><pre>${esc(v.trim())}</pre></section>`)
      .join("")}
    ${r.unverified.length ? `<section><h4>Nicht verifiziert</h4><ul class="crit">${r.unverified.map((u) => `<li>${esc(u)}</li>`).join("")}</ul></section>` : ""}
    ${r.handoffs.length ? `<section><h4>Übergaben</h4><ul class="crit">${r.handoffs.map((h) => `<li>.agent/handoff/${esc(h)}</li>`).join("")}</ul></section>` : ""}
  </div>
</article>`;

function render(runs) {
  const cols = COLUMNS.map(
    ([key, label]) => `<section class="col"><h2>${label} <span class="n">${runs.filter((r) => r.column === key).length}</span></h2>
    ${runs.filter((r) => r.column === key).map(card).join("") || '<p class="empty">–</p>'}</section>`
  ).join("");

  return `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Evidence Board — ${esc(basename(repo))}</title>
<style>
:root{--bg:#faf9f7;--fg:#1c1b19;--mut:#6b6862;--line:#e2ded8;--card:#fff;--good:#2f7d4f;--bad:#b3261e;--warn:#8a6100;--warnbg:#fdf6e3;--acc:#2f5f8f}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#16150f;--fg:#eae7e0;--mut:#9c968c;--line:#33302a;--card:#1e1d17;--good:#6cc08b;--bad:#f2988f;--warn:#e0b350;--warnbg:#2a2415;--acc:#8ab4dd}}
:root[data-theme=dark]{--bg:#16150f;--fg:#eae7e0;--mut:#9c968c;--line:#33302a;--card:#1e1d17;--good:#6cc08b;--bad:#f2988f;--warn:#e0b350;--warnbg:#2a2415;--acc:#8ab4dd}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}
header.top{padding:20px 24px;border-bottom:1px solid var(--line);display:flex;gap:16px;align-items:baseline;flex-wrap:wrap}
header.top h1{margin:0;font-size:19px;letter-spacing:-.01em}
header.top .meta{color:var(--mut);font-size:13px}
.board{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;padding:16px;align-items:start}
.col>h2{margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut)}
.n{color:var(--mut);font-weight:400}
.empty{color:var(--mut);padding:8px 2px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;margin-bottom:12px;overflow:hidden}
.card>header{padding:12px 14px;cursor:pointer}
.card>header:hover{background:color-mix(in srgb,var(--acc) 6%,transparent)}
.id{font:12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--mut)}
.card h3{margin:4px 0 8px;font-size:15px;font-weight:600;letter-spacing:-.01em}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chip{font-size:12px;padding:2px 8px;border-radius:99px;border:1px solid var(--line);color:var(--mut)}
.chip.good{color:var(--good);border-color:color-mix(in srgb,var(--good) 40%,transparent)}
.chip.bad{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 40%,transparent)}
.chip.decisions{color:var(--acc);border-color:color-mix(in srgb,var(--acc) 40%,transparent)}
.gaps{margin:10px 0 0;padding:8px 10px 8px 26px;background:var(--warnbg);border-radius:6px;color:var(--warn);font-size:13px}
.gaps li{margin:1px 0}
.card[data-open=false] .body{display:none}
.body{padding:0 14px 14px;border-top:1px solid var(--line)}
.body section{margin-top:14px}
h4{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--mut)}
.ledger{border-left:3px solid var(--line);padding:2px 0 2px 10px;margin-bottom:10px}
.ledger.r2{border-color:var(--bad)}.ledger.r1{border-color:var(--warn)}.ledger.r0{border-color:var(--good)}
.ledger p{margin:3px 0}
.ledger .why{color:var(--mut);font-size:13px}
.rev{font-size:12px;color:var(--mut)}
.miss{color:var(--warn);font-size:13px}
ul.crit{margin:0;padding-left:18px}ul.crit li{margin:2px 0}
table{width:100%;border-collapse:collapse;font-size:13px}
td{padding:3px 0;border-bottom:1px solid var(--line)}
td:last-child{text-align:right;font:12px ui-monospace,SFMono-Regular,Menlo,monospace}
.good{color:var(--good)}.bad{color:var(--bad)}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
figure{margin:0}
figure img{width:100%;border:1px solid var(--line);border-radius:6px;display:block;cursor:zoom-in}
figure img:target,figure img.zoom{position:fixed;inset:16px;width:auto;height:auto;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);margin:auto;z-index:9;object-fit:contain;background:var(--card);cursor:zoom-out}
figcaption{font-size:11px;color:var(--mut);margin-top:3px;overflow-wrap:anywhere}
pre{margin:0;padding:8px 10px;background:var(--bg);border:1px solid var(--line);border-radius:6px;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-x:auto;white-space:pre-wrap}
</style></head><body>
<header class="top"><h1>Evidence Board</h1>
<span class="meta">${esc(basename(repo))} · ${runs.length} Lauf${runs.length === 1 ? "" : "e"} · erzeugt ${new Date().toLocaleString("de-DE")}</span></header>
<div class="board">${cols}</div>
<script>
document.addEventListener('click', e => { if (e.target.tagName === 'IMG') e.target.classList.toggle('zoom'); });
</script>
</body></html>`;
}

// ---------------------------------------------------------------- run

const runs = collect();
writeFileSync(out, render(runs), "utf8");
console.log(`${runs.length} run(s) -> ${out}`);
for (const r of runs) if (r.gaps.length) console.log(`  ${r.id}: ${r.gaps.join(", ")}`);
