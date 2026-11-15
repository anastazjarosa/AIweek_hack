# Architecture

Mosaic is one Next.js app (App Router, TypeScript). The browser holds each student's own data;
the server runs the AI agents, the guardrails and the class-level teacher data.

## The learning loop

```mermaid
flowchart LR
  P["Knows you<br/>behaviour-based profile"] --> L["Learn by doing<br/>lectures + Simulation Lab + Pip"]
  L --> R["Shows weak spots<br/>predictions, quizzes, explanations"]
  R --> PL["Plans your path<br/>exam planner + habit coach"]
  PL --> P
  R -. anonymous counts .-> T["Teacher Studio<br/>class misconceptions"]
```

## Agents and guardrails

```mermaid
flowchart TB
  Q[Student question] --> G1{Input guard<br/>injection, diagnosis}
  G1 -- blocked --> X[Polite refusal]
  G1 -- ok --> D["Designer agent (Claude)<br/>structured output: a spec, never code"]
  D --> V{"Engine verifier<br/>checkSpec + fair test"}
  V -- disagrees --> D
  V -- ok --> RQ[Teacher review queue]
  RQ -- approval on --> W[Student waits] --> A[Approved experiment]
  RQ -- approval off --> A
  D -. API down / no key .-> OF[Closest ready-made experiment]

  C[Question to Pip] --> G2{Input guard} --> H{"Human-review triggers<br/>high stakes, ambiguous,<br/>circular, low confidence"}
  H -- pause --> E["Escalation queue<br/>answer / override / resume"]
  H -- ok --> RT["Retrieval<br/>3 best slides or the experiment"] --> CO["Coach (Claude, streamed)<br/>or offline coach"] --> G3{"Output guard<br/>citations checked,<br/>diagnosis talk replaced"} --> S[Streamed reply with citation chips]
```

Every step writes to the agent log (`lib/ai/log.ts`) with the tab's session id, which the Teacher
Studio shows next to each escalation.

## Where things live

| Area | Code |
|---|---|
| Simulation engine (6 tested models) | `lib/sim/templates.ts`, `lib/sim/spec.ts`, `lib/sim/library.ts` |
| Live canvas scenes | `components/sim/scenes/` |
| Designer agent, prompts, input guard | `lib/ai/` |
| Pip the coach | `lib/coach/`, `components/coach/`, `app/api/coach/` |
| Learning profile and patterns | `lib/learner/` |
| Planner, habit coach, check-in | `lib/planner/` |
| Teacher Studio | `lib/teacher/`, `components/teacher/`, `app/api/teacher/` |
| MCP server | `mcp/server.ts`, `lib/mcp/tools.ts` |
| Consent and privacy | `lib/privacy.ts`, `components/consent-gate.tsx`, `app/privacy/` |
| Lectures, focus sessions, Pip's body | `components/lecture/`, `lib/screentime/`, `components/pip/` |

## Data

| Data | Where | Why |
|---|---|---|
| Profile, learning events, plans, consent | Browser `localStorage` | The student owns it; download and delete on `/privacy` |
| Agent log, escalations, reviews, class counts | Server memory | Demo; production needs a database and teacher sign-in |
| What reaches Anthropic | Only the question, the retrieved course text and the explanation | Never names, profiles or plans |

## Failure modes, by design

| If… | Then… |
|---|---|
| No API key, `MOSAIC_AI=off`, or the API is down | Experiments fall back to the closest ready-made one; Pip answers from the slides |
| The AI writes a wrong answer key | The engine catches it and sends it back (up to 3 tries) |
| The AI cites a source that doesn't exist | The citation is dropped before the student sees it |
| A question needs a human | The coach pauses with a checkpoint; the teacher answers, overrides or resumes |
| A class group is tiny | It is hidden (fewer than 5 responses) |
