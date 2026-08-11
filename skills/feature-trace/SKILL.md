---
name: feature-trace
description: Follows one feature end to end across both repos — UI event through component, state, HTTP, backend endpoint, service, persistence — naming every file and line. Use it to find where a change must land, where data comes from, or where a value gets lost between frontend and backend.
---

# Feature trace

The frontend/backend split means the answer to "where does this number come from" lives in a repo you are not currently in. A trace crosses that boundary once and writes it down, so the next person crosses it by reading.

Trace **one concrete instance** — one button, one value, one request. Tracing a feature in general produces an architecture diagram; tracing one instance produces something you can act on.

## The path

Follow it in order. At each hop, name the file and line, and state what the data looks like there — because the point at which the shape changes is usually the point you were looking for.

**Split the two repos across two subagents.** Hops 1–4 live in the frontend, hops 5–6 in the backend, and they meet at one known value: the method and URL. Give the frontend agent the trigger to start from, and the backend agent that method and URL — then join their reports at the seam. Two repos' worth of file reading in one context is what makes a trace run out of room halfway through, and the join is exactly where the findings are anyway.

When the URL is not yet known, run the frontend side first and dispatch the backend side once hop 4 has produced it.

**1. The trigger.** The exact element and its handler. Find it by the i18n key or the accessible label rather than by guessing at component names.

**2. The component layer.** Which component holds the handler, what it does locally, what it delegates. Note where the loading and error state is held.

**3. The state layer.** Store, service, facade, hook, query. What is dispatched, what the resulting state shape is, whether the update is optimistic, and where the cache key lives.

**4. The HTTP boundary.** The exact method and URL, including path and query parameters. The request body's real shape. Interceptors that modify it — auth headers, correlation ids, base URL rewriting. This is where a frontend trace usually stops; do not stop here.

**5. Cross to the backend.** Find the route that serves this URL. Search the backend repo for the path fragment, or the controller attribute or decorator that declares it. Name the controller and method.

**6. The backend path.** Controller → service or handler → repository or query → data source. What each layer transforms, and where the response shape is assembled. Note the validation and the authorisation check, and where each sits.

**7. Back to the pixel.** The response shape, how it maps to the frontend model, where the mapping happens, and what finally renders. Name the field-level mismatches — a nullable backend field mapped to a non-nullable frontend type is a bug waiting for the right data.

## What to watch for

The valuable findings are almost always at the seams:

- A field renamed in the mapping layer, so business term and code term diverge
- Validation implemented on only one side
- A shape the generated client claims and the endpoint does not actually serve — confirm against `api-contract-sync`
- Two frontend paths reaching the same endpoint with different assumptions
- An authorisation check the UI performs and the backend does not, or the reverse

## Write it

```markdown
# Trace: <feature> — <the concrete instance>
Date: <ISO> · FE commit: <sha> · BE commit: <sha>

## Path
<Numbered hops, each with file:line and the data shape at that point>

## Seams
<Where the shape changes, and where the two sides disagree>

## Findings
<Bugs, mismatches and surprises found while tracing>

## Change here
<For the likely kinds of change, which hop you would touch>
```

The commits are what let a later reader tell whether the trace still holds.

## Done when

Every hop from trigger to persistence and back is named with a real file and line, the data shape is stated at each seam, the two repos' commits are recorded, and every mismatch found is written under Findings rather than smoothed over.
