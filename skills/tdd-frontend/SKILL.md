---
name: tdd-frontend
description: Test-first discipline for UI work — the seam comes from the spec, the failing test comes before the code, the assertion describes what the user experiences. Use it when a step's behaviour is specifiable before it is built.
---

# TDD frontend

The payoff of test-first in an unattended run is narrow and specific: **a test observed failing first is a test you know can fail**. Written after the code, it passes immediately, and a test that has never been red may be asserting nothing at all. You find out eighteen months later, when the regression it was supposed to catch ships.

## The seam is already decided

A test needs a boundary to observe behaviour at — the public interface you assert against without reaching inside. Choosing badly is the difference between a suite that survives refactoring and one that goes red every time anything moves.

That choice belongs to `spec-forge`, not to this loop. The spec names the seams for the work before implementation starts, which is what lets the loop run without stopping to ask. Where a step arrives without one, prefer the existing seam its neighbours already use over introducing a new one, take the highest seam that can still observe the behaviour, and record the choice in the ledger.

## The loop

**Red.** Write the smallest test stating one behaviour from the acceptance criteria. Run it. It must fail *for the reason you predicted* — "expected the error panel, found nothing", not "cannot read property of undefined". A wrong-reason failure means the test is broken, so fix the test before writing any implementation.

**A test asserting an absence is green from the start.** `expect(queryByRole(...)).not.toBeInTheDocument()` passes trivially while the element does not exist anywhere, so it never goes red and proves nothing about the behaviour it claims to cover — "the filter bar is hidden when the list is empty" passes identically when there is no filter bar at all. Give it a red phase by pairing it: the same test first asserts the element **is** present in the case where it should be, then absent in the case where it should not. Where that is impossible, write the absence test *after* the feature exists and confirm it fails by temporarily removing the condition.

**Green.** Write the least code that passes it.

**Refactor.** Improve the shape with the test green. Red during refactoring is a real behaviour change — undo it rather than adjusting the test.

**One behaviour per pass.** Writing all the tests first and then all the implementation looks efficient and is not: bulk tests assert the behaviour you imagined before building anything, they commit you to a structure you have not yet learned anything about, and they end up insensitive to the changes that matter. One test, one implementation, then let what you learned shape the next one.

Run `pattern-mine` on the nearest existing tests before the first pass. Test arrangement is a strong per-repo convention — which helper renders the component, which factory builds the data, what gets mocked, how async is awaited.

## What to assert

What the user experiences. Component internals are the implementation, and asserting them is why suites go red on refactors and eventually get deleted wholesale.

| Instead of | Assert |
|---|---|
| `component.isLoading === true` | The skeleton or spinner is on screen |
| `expect(spy).toHaveBeenCalled()` as the whole test | The UI change that call produces |
| A whole-output snapshot | The specific text, role and state that matters |
| The store's internal shape | What the store's consumer renders |

Query the way a user finds things — by role and accessible name, `getByRole('button', { name: /speichern/i })`. Accessibility failures then surface as test failures, which is the cheapest place for them to surface.

Expected values come from somewhere independent: a known-good literal, the spec, a worked example. An assertion that recomputes the expectation the way the code computes it agrees with the code by construction and can never disagree with it.

## What earns a test

Not everything. A suite that covers every line is a suite nobody maintains.

Worth it: conditional rendering, form validation and its messages, data transformation and formatting, error and empty states, permission-dependent rendering, anything involving a date, timezone or currency, and anything that has broken before.

Not worth a unit test: that a component renders at all with no assertion, that a library does what its own tests cover, static markup, or styling — `visual-verify` is the right instrument for the last one.

## Guardrails

Read `agentic-guardrails`. Three bite specifically in test work:

- A failing test means the **code** is wrong until you have evidence the assertion was wrong. Where the assertion genuinely was wrong, fix it *and* ledger it — in a diff, a silently corrected test and a weakened one look identical.
- Assertions get **sharper** under pressure. Replacing `toBe('3 Artikel')` with `toBeTruthy()` deletes the test while leaving the file in place.
- A snapshot is updated only after reading the diff and confirming the new output is correct, with the reason recorded.

## Done when

Every behaviour in the step's acceptance criteria has a test that was observed failing for the predicted reason and now passes, each was written at the seam the spec named, the assertions describe user-visible outcomes against independently sourced expectations, and the suite is green.
