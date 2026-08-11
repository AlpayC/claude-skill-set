---
name: visual-verify
description: Proves a UI change works by driving it in a real browser — starts the dev server, reaches each state from the spec, screenshots it, and reads console and network for errors the DOM does not show. Run it after any user-visible change and before handover.
---

# Visual verify

A passing unit test proves a function returns what it was told to return. It does not prove the page renders, that the button is reachable, that the request fires, or that the console is not full of errors. For frontend work, this gap is where unattended runs quietly fail.

Closing it requires actually looking. Invoke the `claude-in-chrome` skill for the browser tooling, then work through the states.

## 1 — Get the app running

From `docs/agent/repo-map.md`: the dev server command, its port, and the route base for the feature.

Start it in the background and wait for it to be genuinely ready — the port accepting connections is not the same as the bundle being served. Watch the server output for the ready line.

Handle the preconditions the app needs before the feature is reachable at all: authentication, a mock backend, seeded data, a feature flag. These are recorded in the app's `CLAUDE.md`; when they are not, discovering them is a finding to write back there so the next run does not rediscover it.

When the server cannot be started, that is a stop condition, not a reason to skip the gate. Report it — an unverified UI change reported as unverified is fine; one reported as working is not.

## 2 — Walk the states

The spec's acceptance criteria and `ui-spec`'s state matrix are the checklist. Reach each state and screenshot it into `.agent/evidence/<id>/`, named for the state: `orders-empty.png`, `orders-error-403.png`, `orders-loading.png`.

Reaching the unhappy states is the work. The happy path is one navigation; the rest need setup:

- **Empty** — a filter that matches nothing, or a fresh account
- **Loading** — throttle the network, or intercept the request and delay it
- **Error** — intercept the request and return 500, 403, or a malformed payload
- **Permission** — log in as each role, or stub the permission source
- **Boundary** — inject a long string, a large list, a null in an optional field

Where a state cannot be reached from the UI, drive it by intercepting the request.

**Every state you could not reach goes in `.agent/evidence/<id>/unverified.md`** — the state, what blocked it, and whether a test covers it instead. Not in your final message, where it is read once and lost: this file is what `pr-package` and the review board read, and it is what makes the rest of the evidence trustworthy.

The blocker is often the blast radius. Reaching an empty or error state may require changing the mock or the fixture data, and when that file is outside what the spec allows, the honest outcome is an entry here rather than an edit that widens the run.

## 3 — Read what the screenshot cannot show

A page can look perfect and be broken. After each state:

- **Console** — read it filtered for errors and warnings. React key warnings, Angular change-detection errors, unhandled rejections and hydration mismatches all render fine and are all defects.
- **Network** — failed requests, unexpected 4xx, requests fired twice, requests fired on every keystroke. A duplicated request is a real bug that no screenshot shows.

**Start the network reader before the page loads.** Recording begins when the tool is first called, so the initial load — which is where the interesting requests are — is missed entirely on a first visit. Call it once against the blank tab, then navigate; or reload and read again, and say in the evidence that the numbers come from a reload.

A **duplicated request that succeeds on the second attempt** is the case this step exists for. In development, React StrictMode invokes effects twice, so a failing first request is masked by a passing second one and the screenshot shows healthy data. Read the status of *every* request, not just whether data appeared.

Record both into `.agent/evidence/<id>/console.md`, including an explicit "no errors" when there were none. A missing section is ambiguous; an explicit negative is evidence.

## 4 — Smoke the accessibility

Not a full audit — the four checks that catch most of what an agent breaks:

- **Keyboard** — tab through the feature. Every interactive element reachable, focus visible, no trap.
- **Focus after change** — close the modal, delete the row, trigger the error: focus lands somewhere sensible rather than on `<body>`.
- **Names** — icon-only buttons have accessible names.
- **Zoom** — at 200%, nothing is clipped or overlapping.

## 5 — Compare against the design

Where a design exists, compare the screenshot to it and report differences in terms of tokens rather than pixels: "spacing between rows is `--space-3`, design shows `--space-4`". Pixel-diffing a screenshot against a mockup generates noise; token mismatches are actionable.

## Done when

Every state in the spec has a screenshot or an entry in `unverified.md` with its blocker, console and network are recorded for each state including the negatives and including the status of every individual request, the four accessibility checks have been run, and every defect found is either fixed and re-verified or written into the handover.
