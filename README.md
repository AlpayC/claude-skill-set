# Claude Skill Set — Agentic Coding mit Leitplanken

Ein Satz von 34 Skills für Claude Code, gebaut für **agentisches Arbeiten in Enterprise-Codebases**: der Agent soll ein Ticket end-to-end umsetzen können, ohne während der Implementierung nachzufragen.

## Das Leitprinzip

Autonomie entsteht nicht durch bessere Implementierungs-Prompts, sondern dadurch, dass die menschliche Entscheidung aus der Mitte an die Ränder wandert:

```
VORHER (Mensch entscheidet)  →  WÄHREND (Agent allein)  →  NACHHER (Mensch reviewt)
Spec, Akzeptanzkriterien,       Ledger statt Rückfrage,     Evidence-Paket,
Kontext, Blast Radius           Gate statt Behauptung       Self-Review, PR
```

Jede Rückfrage während der Umsetzung hat genau zwei Ursachen: **fehlender Kontext** (der Agent weiß nicht, wie ihr Dinge tut) oder **unentschiedene Spec** (die Frage war vorher schon offen). Die Skills zahlen auf jeweils eine davon ein.

Drei Primitive tragen das:

- **Assumption Ledger** — statt zu fragen entscheidet der Agent, schreibt Entscheidung, Alternative, Begründung und Reversal Cost nach `docs/specs/<id>.assumptions.md` und arbeitet weiter. Der Mensch prüft die Liste im Review.
- **Repair Budget** — drei Reparaturversuche pro rotem Gate, jeder mit vorher ausgesprochener Hypothese. Danach Revert und präziser Fehlerbericht statt Weiterwursteln.
- **Evidence** — „funktioniert" ist eine Behauptung; jede Behauptung braucht ihren Beleg (Exit Code, Screenshot). Ohne Beleg wird sie als *unverified* gemeldet.

Alle drei stehen an genau einer Stelle: `agentic-guardrails`. Alle anderen Skills referenzieren sie per Name.

**Und sie stehen nicht nur als Text da.** Vier dieser Regeln sind als Hooks installierbar (`guardrail-hooks`) und werden damit erzwungen statt erbeten — Prosa im Kontextfenster ist ein Vorschlag, und die Befolgung sinkt mit der Sessionlänge, also genau unter der Bedingung, die unbeaufsichtigtes Arbeiten herstellt.

## Eigenständig

Der Satz hat keine Abhängigkeit zu anderen Skill-Plugins. Jeder Skill referenziert nur Skills aus diesem Repo, und die geteilten Regeln stehen ausschließlich in `agentic-guardrails`. Was hier gebraucht wird, ist hier drin — kein Plugin, das sich unter dir ändern kann.

## Repo-agnostisch

Die Skills nehmen keine bestimmte Repo-Struktur an. `repo-cartograph` erkennt die Workspace-Art — NX, Turborepo, pnpm/npm/yarn-Workspaces, Lerna, Rush, Single-Package, Polyrepo, Maven/Gradle/.NET/Go/Cargo — und schreibt Enumerierung, Dependency-Graph, Gate-Kommandos, Boundary-Mechanismus und Changed-Set-Befehl nach `docs/agent/repo-map.md`. Alle anderen Skills lesen daraus, statt Kommandos zu raten. Für Repos ohne Affected-Tooling gibt es eine Fallback-Leiter (`git diff` → Manifest-Zuordnung → Dependents → bei Root-Config alles).

Bei mehreren Repos (Frontend + Backend) bekommt jedes seine eigene Map; die Verbindung steht unter **Seams** und wird von `api-contract-sync` und `feature-trace` benutzt.

## Die Kette

```
repo-cartograph ─┐
context-baseline ├─→ spec-forge ─→ implement-spec ─→ green-gate ─→ visual-verify ─→ self-review ─→ pr-package
api-contract-sync┤      ↑ grill-spec        ↑ pattern-mine
domain-glossary ─┘      ↑ ui-spec           ↑ tdd-frontend
```

## Die Skills

**Fundament** — `repo-cartograph` · `context-baseline` · `api-contract-sync` · `domain-glossary`
**Vor der Umsetzung** — `epic-map` · `spec-forge` · `grill-spec` · `ui-spec`
**Während** — `implement-spec` · `agentic-guardrails` · `guardrail-hooks` · `green-gate` · `visual-verify` · `pattern-mine` · `tdd-frontend` · `bug-hunt` · `refactor-safe` · `dep-upgrade`
**Danach** — `self-review` · `pr-package` · `review-run` · `adr-capture` · `session-handoff`
**Wissen** — `explain-like-im-new` · `feature-trace` · `arc42-sync` · `dev-wiki` · `runbook`
**CI/CD** — `pipeline-doctor` · `flaky-triage` · `ci-authoring` · `perf-budget`
**Meta** — `autonomy-postmortem` · `skill-forge` · `skills-map`

Details und Auswahlhilfe: `/skills-map`.

## Installation

```powershell
.\install.ps1            # Junctions nach ~\.claude\skills (Änderungen wirken sofort)
.\install.ps1 -Copy      # stattdessen kopieren
.\install.ps1 -Scope project -Target C:\pfad\zum\repo   # nur für ein Repo
```

Skills werden beim nächsten Start von Claude Code geladen.

Skills und die drei Reviewer-Agenten kommen mit `install.ps1`. Hooks und Permissions werden **pro Ziel-Repo** installiert, weil sie dessen Blast Radius und Evidence prüfen:

```bash
node hooks/install-hooks.mjs C:\pfad\zum\repo --permissions   # Hooks + Allowlist
node hooks/install-hooks.mjs C:\pfad\zum\repo --local         # persönlich, settings.local.json
node hooks/install-hooks.mjs C:\pfad\zum\repo --dry-run       # nur zeigen
```

`--permissions` merged die Allowlist aus `settings/permissions.json` dazu — sie lässt einen unbeaufsichtigten Lauf durchlaufen, ohne Permissions komplett zu umgehen. Begründung und was bewusst **nicht** drin ist: `settings/README.md`.

Merged in bestehende Settings, idempotent, ergänzt `.agent/` in der `.gitignore`. Danach einmal `/hooks` öffnen oder neu starten — der Settings-Watcher folgt nur Verzeichnissen, die beim Sessionstart schon eine Settings-Datei hatten.

## Reihenfolge für den Start

1. **`repo-cartograph`** im Frontend-Repo, dann im Backend-Repo. Alles andere liest die Map.
2. **`context-baseline`** — Root-`CLAUDE.md` plus je eine Datei pro App, die abweicht.
3. **`api-contract-sync`** — einmal einrichten, damit die API-Form nie geraten wird.
4. Dann ein echtes, kleines Ticket durch **`spec-forge` → `implement-spec`** laufen lassen.
5. Nach jeder Unterbrechung **`autonomy-postmortem`**.

Schritt 5 ist der wichtigste. Ohne ihn bleibt der Satz so autonom wie am Installationstag; mit ihm entfernt jede Unterbrechung dauerhaft eine ganze Klasse von Unterbrechungen.

## Artefakte, die die Skills anlegen

| Pfad | Von | Inhalt |
|---|---|---|
| `docs/agent/repo-map.md` | `repo-cartograph` | Workspace-Art, Projekte, Stacks, Gates, Boundaries, Seams |
| `docs/agent/glossary.md` | `domain-glossary` | Fachbegriff → Code-Identifier, mit Aliassen |
| `docs/agent/wiki/` | `dev-wiki` | Beantwortete Fragen mit Datei-Belegen |
| `docs/agent/autonomy-log.md` | `autonomy-postmortem` | Eine Zeile pro Unterbrechung — der Trend |
| `docs/agent/perf-baseline.md` | `perf-budget` | Gemessene Baseline mit Commit und Bedingungen |
| `docs/epics/<id>.md` | `epic-map` | Slices, offene Entscheidungen, Gelerntes |
| `docs/specs/<id>.md` | `spec-forge` | Die Spec, gegen die der Lauf läuft |
| `docs/specs/<id>.assumptions.md` | alle Umsetzungs-Skills | Das Ledger |
| `.agent/current-run.json` | `implement-spec` | Aktiver Lauf — die Hooks lesen daraus Blast Radius und Status |
| `.agent/handoff/` | `session-handoff` | Übergabenotizen, chronologisch |
| `docs/adr/NNNN-*.md` | `adr-capture` | Architekturentscheidungen (arc42 Kap. 9 indiziert sie) |
| `docs/architecture/` | `arc42-sync` | arc42-Dokument, ein File pro Kapitel |
| `.agent/evidence/<id>/` | `green-gate`, `visual-verify`, `bug-hunt` | Gate-Output, Screenshots, Console/Network, Repro-Kommando, gerankte Hypothesen |

`.agent/` gehört in die `.gitignore`; `docs/` wird committet.

## Die Morgen-Review

Zwei getrennte Oberflächen, mit Absicht:

- **Überblick** — `node tools/evidence-board.mjs <repo>` erzeugt `.agent/board.html`: alle Läufe in vier Spalten (Spec bereit, Läuft, Review nötig, Blockiert), Lücken gelb markiert, Screenshots eingebettet. Eine Datei ohne Server, gitignored, weil sie interne Screenshots enthält.
- **Eingriff** — `review-run` legt dir einen Lauf **im Gespräch** vor: Entscheidungen zuerst mit Empfehlung, Screenshots inline gerendert, Lücken als Fragen formuliert. Du antwortest an derselben Stelle, der Agent setzt sofort um.

Das Board sagt dir, worauf du schauen musst. Der Eingriff passiert im Chat, damit ein Einwand einen Satz kostet statt Kopieren und Fensterwechsel.

## Parallelität

Eine Regel: **Lesen parallelisieren, Schreiben serialisieren.** Zwei Agents in einem Arbeitsbaum zerschießen sich gegenseitig.

Fan-out per Subagent nutzen `repo-cartograph` (Stack-Erkennung pro Projekt), `pattern-mine` (die drei Beispiele), `feature-trace` (Frontend- und Backend-Pfad), `epic-map` (eine Recherche pro offener Entscheidung), `green-gate` (finaler Lauf über unabhängige Projekte) und `self-review` (drei Achsen in frischem Kontext).

Bewusst seriell: der `green-gate`-Schrittloop (billigstes zuerst ist der Punkt) und `bug-hunt` Phase 4 (mehrere Hypothesen gleichzeitig heißt mehrere Variablen gleichzeitig).

Für zwei Tickets parallel: zwei **git worktrees**, je eigener Branch, eigene `.agent/current-run.json`, eigener Blast Radius. Details in `/skills-map`.

## Context Load

Die 32 model-invoked Beschreibungen liegen bei ~8,4 KB (≈ 2.100 Token) und sind in jedem Turn geladen. `skillListingBudgetFraction` (Default 1 % des Fensters) kürzt automatisch, wenn die gesamte Skill-Liste — inklusive aller anderen installierten Plugins — darüber liegt.

Bis auf `skills-map` und `skill-forge` sind alle Skills model-invoked — sie feuern selbst und können sich gegenseitig aufrufen, was die Kette überhaupt erst ohne Tippen laufen lässt. Preis dafür ist, dass ihre `description` in jedem Turn im Kontext liegt.

Wer das reduzieren will: `disable-model-invocation: true` ins Frontmatter der Skills, die nur per Hand starten sollen. Was in einer Kette steckt, bleibt model-invoked — ein user-invoked Skill kann von keinem anderen Skill erreicht werden.

## Was noch im Repo liegt

| Pfad | Wofür |
|---|---|
| `hooks/` | Vier Node-Hooks, die vier Guardrail-Regeln erzwingen statt erbitten |
| `agents/` | Die drei Reviewer, die `self-review` in frischem Kontext losschickt — ohne Editier-Werkzeuge |
| `settings/` | Permissions-Allowlist plus die Begründung, was drin ist und was nicht |
| `tools/evidence-board.mjs` | Das Review-Board über alle Läufe |
| `tools/check.mjs` | Prüft den Skill-Satz selbst — vor dem Commit und in CI |

`node tools/check.mjs` meldet Fehler (Skill lädt nicht) und Warnungen (Skill lädt, feuert aber vermutlich nicht). Die Warnung „leads with the artefact" fängt genau den Fehler, der `repo-cartograph` im echten Repo nicht feuern ließ.

## Anpassen

Die Skills sind bewusst Prozess und nicht Konfiguration — sie sollen gelesen und verändert werden. `skill-forge` beschreibt den Hausstil: benannter Failure Mode am Anfang, prüfbare `## Done when`-Kriterien, positive Formulierung statt Verbote, eine Wahrheitsquelle pro Regel, Kommandos aus der Umgebung statt hartkodiert.
