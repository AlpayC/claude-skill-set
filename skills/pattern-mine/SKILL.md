---
name: pattern-mine
description: Extracts the codebase's own convention before building something new — finds the three closest existing examples, reads them fully, derives what they agree on. Run it before creating any component, service, store slice, test, route or form.
---

# Pattern mine

An agent writing a component from general knowledge produces idiomatic code for the framework and foreign code for the repo. Reviewers reject it, and they are right to: it is a second way to do a thing that already had one.

The fix is mechanical. Before writing, read what exists.

## 1 — Find three

Three, not one. One example is indistinguishable from an accident; three reveal what is deliberate.

Search by structural similarity, not by name. For a paginated table with row actions, the nearest neighbours are other paginated tables with row actions — in any app, in any feature.

- Same project first (local convention wins over workspace convention)
- Then sibling projects with the same stack, per `docs/agent/repo-map.md`
- Prefer **recently touched** files: `git log -1 --format=%ai -- <file>`. A three-year-old component shows the convention the team is migrating away from, and copying it propagates the thing they are trying to delete.

When three do not exist, say so. Two is thin evidence; one is precedent, not convention; zero means you are establishing the pattern, which is a ledger entry and worth flagging in the PR.

## 2 — Read them fully

In full, not skimmed. The convention is usually in the parts that look like boilerplate: how errors are handled, where types are declared, what is exported from the barrel, how the test is arranged, what the file header carries.

Read the three in parallel — one subagent each, each returning the extracted slots below with a file:line for every one. Three whole components, their tests and their neighbours is a lot of text to pull into the run that then has to write code; the subagents absorb it and hand back the conclusions. Keep the briefs identical, because the value is in what the three answers agree on, and differently-phrased briefs produce differences that are about the briefs.

Extract, with a file:line citation for each:

- **File and folder layout** — one file or several, naming, where the test sits
- **Component shape** — smart/dumb split, inputs and outputs, change detection strategy or memoisation
- **Data access** — direct call, service, facade, hook, query; where the loading and error state is held
- **Types** — where declared, exported or local, how nullability is handled
- **Errors** — swallowed, surfaced, thrown, mapped to a UI state
- **Styling** — which system, where tokens come from, how variants are expressed
- **Tests** — what is asserted, what is mocked, which utilities and factories
- **i18n and a11y** — key naming, which attributes are consistently present

## 3 — Report the pattern and the disagreements

Where the three agree, that is the pattern — follow it. Where they disagree, the disagreement is the finding:

```markdown
## Pattern: feature table component
Agreed (3/3): container fetches via facade, presentational table takes rows as input
  — apps/orders/.../order-table.container.ts:14
Agreed (3/3): errors mapped to a `ViewState` union, never thrown to the boundary
Split (2/1): two use `trackBy` on the row id, the newest omits it
  → Follow the newest: it uses the framework's built-in tracking. Ledger A4.
Absent: none of the three handle the empty-filter case
  → Spec requires it. New pattern, flagged in the PR.
```

For a split, pick by recency and by which direction the codebase is moving — then say which you picked and why, because a reviewer seeing the minority pattern needs to know it was a choice.

## Done when

Three examples are cited by path and line, every slot in step 2 is either extracted or marked absent, disagreements are resolved with a stated reason, and anything genuinely new is named as new rather than presented as convention.
