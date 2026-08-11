---
name: ui-spec
description: Turns a design — Figma link, screenshot or description — into a component spec buildable without inventing anything. Token mapping, the full state matrix, responsive behaviour, and an explicit list of what the design does not show. Run it before building UI from a mockup.
---

# UI spec

A mockup shows one state of one breakpoint with realistic data. An implementation needs every state at every breakpoint with hostile data. The gap between those two is where an unattended run starts inventing — and invented UI is the kind of wrong that survives review, because it looks finished.

This skill closes the gap on paper, before any of it is built.

## 1 — Map to what already exists

Never describe a component in the abstract when the workspace already has one. Run `pattern-mine` for the nearest existing component and specify by difference: "the standard `DataTable` from `libs/ui/table`, with a sticky first column and row selection".

For every visual value in the design, resolve it to a **token**, not a literal:

| In the design | In the spec |
|---|---|
| `#1B4B8F` | `--color-primary-700` |
| 24px gap | `--space-6` |
| that shade of grey text | `--color-text-muted` |

A literal hex in a spec becomes a hardcoded hex in the code, which survives every theme change and every rebrand. When a design value has no matching token, that is a finding for the design system owner and a ledger entry — not a licence to hardcode. Say which token you chose as the nearest and by how much it differs.

## 2 — Write the state matrix

For each component in the design, specify all of these. Where the design is silent, say so explicitly and name the fallback:

- **Default, hover, focus-visible, active, disabled, read-only** — focus especially: designs omit it about as often as keyboard users need it
- **Loading** — skeleton, spinner, or stale-with-overlay, and which
- **Empty** — first-use empty versus filtered-to-nothing empty, with the actual copy
- **Error** — inline, toast, or full-page, with the actual copy, and what the user can do next
- **Selected / expanded / active-route** where applicable

Copy belongs in the spec verbatim, with its i18n key. An agent asked to write user-facing German copy will write plausible German copy that no reviewer approved.

## 3 — Specify responsive and adaptive behaviour

Name the breakpoints from the codebase's own tokens, and for each: what reflows, what collapses, what disappears, and what the table becomes on mobile — cards, horizontal scroll, or fewer columns. "Responsive" is not a specification.

Also: what happens at 200% browser zoom, and what happens with the longest translated string in the locale set. Both break enterprise layouts far more often than small screens do.

## 4 — Specify interaction and accessibility together

They are the same specification, written once:

- Keyboard path through the component, and the tab order
- Where focus lands after each state change — modal close, row delete, error appear, async complete
- The accessible name and role of every control that is not a plain button with text
- Which changes are announced to a screen reader, and how (live region politeness)
- Motion: what animates, how long, and what it becomes under `prefers-reduced-motion`

## 5 — List what the design does not answer

The most valuable section. Every question the mockup raises and does not settle, with the decision taken and its reason:

```markdown
## Gaps
- Sort indicator for the secondary sort column — not shown.
  → Decided: no indicator, matching `PartnerTable`. Ledger A2.
- Behaviour when the name exceeds one line — mockup shows short names only.
  → Decided: truncate with ellipsis + title attribute, per `libs/ui/table` convention.
- Error copy for 403 — not designed.
  → Blocked: needs UX copy. Placeholder key `orders.error.forbidden`, flagged in the PR.
```

## Done when

Every component maps to an existing primitive or is explicitly new, every visual value resolves to a token or a named exception, every state in the matrix is either specified or has a named fallback, all user-facing copy is verbatim with its i18n key, and the Gaps list is written. Feed the result into `spec-forge` as the acceptance criteria for the UI steps.
