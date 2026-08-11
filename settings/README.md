# settings/permissions.json

Die Allowlist, die einen unbeaufsichtigten Lauf durchlaufen lässt, **ohne** Permissions
komplett zu umgehen.

## Warum eine Liste statt Bypass

Ein Nachtlauf, der um 23:10 an einem Freigabedialog steht, ist acht Stunden Nichts. Der
grobe Ausweg wäre `bypassPermissions` — dann hängt alles daran, dass die Hooks vollständig
sind. Diese Datei ist die feinere Variante:

| Schicht | Wofür |
|---|---|
| `allow` | Was oft passiert und lokal umkehrbar ist — läuft ohne Frage durch |
| alles andere | fragt weiterhin |
| `deny` + Hooks | was nie passieren darf — hart geblockt |

Die `deny`-Liste spiegelt bewusst die Hooks. Doppelt gemoppelt, aber sie greift auch dort,
wo `guardrail-hooks` nicht installiert ist.

## Was bewusst nicht drin ist

- **`npm install` / `npm ci`** — führt beliebige `postinstall`-Skripte aus. Bei `dep-upgrade`
  ist das ein bewusster Schritt und darf fragen.
- **`git push`** — nach draußen, gehört dem Menschen. Steht in `deny`.
- **Alles mit `--force`** — in `agentic-guardrails` als Stop-Bedingung definiert.
- **`node -e`** — führt beliebigen Code aus, wäre ein Loch in der ganzen Liste.

## Installieren

```bash
node hooks/install-hooks.mjs <repo> --permissions
```

Merged in eine bestehende `settings.json`, ohne vorhandene Einträge zu überschreiben.
Doppelte Einträge werden übersprungen.

## Anpassen

Erweitere `allow` mit dem, was in **deinem** Repo häufig und harmlos ist — der eingebaute
`/fewer-permission-prompts` liest dafür deine Transkripte aus und schlägt Einträge aus
echtem Verhalten vor, statt zu raten.

Regel beim Erweitern: ein Eintrag gehört hierher, wenn ein Fehlgriff **lokal und in einem
Commit rückgängig** ist. Alles andere darf fragen.
