# API contract

All routes live under `app/api/` and run on the Node.js runtime. Everything from the browser is
treated as untrusted and validated on the server. AI routes send `x-mosaic-session` (one random id
per browser tab, from `lib/client-api.ts`) so the agent log can group a student's requests without
knowing who they are.

Errors are JSON: `{ "error": "message" }` with a 4xx status. Streaming routes use server-sent
events (`content-type: text/event-stream`): each event is `event: <name>` plus `data: <json>`.

## Student routes

### `POST /api/sim/generate` · build an experiment from a question

Body: `{ "question": string }` (3–300 characters).

Pipeline: input guard → cache → designer agent (Claude, structured output) → engine verifier
(`checkSpec` + fair-test consistency check, up to 3 attempts) → teacher review queue → result.
Offline (no key, `MOSAIC_AI=off`, or any API error) falls back to the closest ready-made experiment.

Response (`GenerateResponse` in `lib/sim/api-types.ts`):

| `source` | Fields | Meaning |
|---|---|---|
| `ai` | `spec`, `reviewId?` | Built by the AI, verified by the engine |
| `pending` | `reviewId`, `note` | Held until a teacher approves (class setting) |
| `library` | `spec`, `note` | Offline or agent failure: closest ready-made experiment |
| `none` | `reason`, `suggestion` | No tested model fits |
| `error` | `error` | Input guard or rate limit |

With `?stream=1` the route streams `trace` events (`{ step: "guard" \| "designer" \| "proposal" \|
"verifier" \| "result", ok?, text }`) and ends with one `result` event carrying the response above.

### `GET /api/sim/review/{id}` · has my experiment been approved?

`{ status: "pending" | "approved" | "rejected", note?, spec? }`. The spec is only returned once approved.

### `POST /api/sim/feedback` · AI feedback on an explanation

Body: `{ spec, guess: "up" | "down" | "same", explanation: string }` (≤ 1200 characters).
The spec is re-checked with `checkSpec`. Response: `{ source: "ai", feedback: { ideas: boolean[],
misconception: boolean, feedback: string } }` or `{ source: "offline" }` (the UI falls back to a self-check).

### `POST /api/coach` · Pip, the Socratic coach (SSE)

Body:

```json
{
  "context": { "kind": "lecture" } | { "kind": "sim", "simId": "catalyst" } | { "kind": "sim", "spec": { } },
  "message": "string, 1–800 characters",
  "history": [{ "role": "user" | "assistant", "content": "string" }],
  "mode": "ask" | "hint" | "check",
  "tone": "friendly" | "funny" | "quest",
  "patterns": ["deep", "quick", ...]
}
```

Pipeline: input guard → human-review triggers (high stakes, ambiguous, circular, low confidence) →
retrieval (3 best slides, or the whole experiment) → Claude or the offline coach → output guard
(invented citations dropped, diagnosis talk replaced) → escalation if needed.

Events: `sources` (retrieved `{ id, title, href? }[]`), `delta` (text chunks), then either `final`
(`{ text, citations, dropped, escalated, replaced, offline }`) or `interrupt` (`{ id, trigger,
reason, confidence }`: paused for a human; poll `GET /api/teacher/escalations/{id}`).

### `POST /api/class/events` · anonymous class signal

`{ kind: "prediction", simId | spec, guess }` or `{ kind: "explanation", simId | spec, covered, possible }`.
No session or name is stored; the right answer is worked out by the engine, not taken from the body.

## Teacher routes (Teacher Studio)

> Demo note: these routes are not role-authenticated and keep data in server memory. Production
> needs school sign-in with a teacher role and durable storage.

| Route | Body | Returns |
|---|---|---|
| `GET /api/teacher/class` | | `{ insights: ClassInsight[], hidden, minGroup }`; groups under 5 responses withheld |
| `POST /api/teacher/class` | `{ action: "sample" \| "clear-sample" }` | `{ ok }` |
| `GET /api/teacher/escalations` | | `{ escalations, logs }` |
| `GET /api/teacher/escalations/{id}` | (same session only) | `{ id, status, answer?, resolution? }` |
| `POST /api/teacher/escalations/{id}` | `{ action: "answer" \| "override", answer }` or `{ action: "resume", guidance }` | the resolved escalation |
| `GET /api/teacher/reviews` | | `{ reviews (with engine verification), settings }` |
| `POST /api/teacher/reviews` | `{ action: "sample" }` | `{ ok }` |
| `POST /api/teacher/reviews/{id}` | `{ action: "approve" \| "reject", note?, edits? }` | `{ review }`; edits are wording only, re-checked, and can't change the verified answer; rejecting needs a note |
| `GET /api/teacher/settings` | | `{ requireApproval }` |
| `POST /api/teacher/settings` | `{ requireApproval: boolean }` | `{ requireApproval }` |

## Limits

| Route | Limit (per client, per minute) |
|---|---|
| `/api/sim/generate` | 8 |
| `/api/sim/feedback` | 20 |
| `/api/coach` | 20 |
| `/api/class/events` | 60 |

## MCP server

`npm run mcp` exposes `list_simulations`, `create_simulation`, `run_simulation` and
`check_prediction` over stdio, built on the same engine and agent (`mcp/server.ts`, `lib/mcp/tools.ts`).
