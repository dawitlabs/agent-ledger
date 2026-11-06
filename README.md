# Relay — Multiplayer AI Workspace

A real-time collaborative workspace where humans and AI agents work on the same long-running tasks together. Anyone can watch progress live, redirect mid-run, hand off ownership, and keep a shared audit trail that becomes team knowledge.

## Features

- **Shared rooms** — create a session, invite teammates, launch an agent from a prompt
- **Live agent progress** — plan, steps, tool calls, and artifact updates
- **Presence** — see who is watching the room
- **Mid-task steering** — inject direction without restarting
- **Handoff** — transfer session ownership with full history intact
- **Shared history** — searchable timeline of human + agent actions
- **Artifact view** — one primary document the agent updates live
- **Roles** — owner / editor / viewer

## Stack

| Layer | Local / demo | Production (env-configured) |
| --- | --- | --- |
| App | Next.js App Router + Tailwind + shadcn/ui | same on Vercel |
| Data | `.data/rooms.json` file store | Supabase Postgres + RLS |
| Realtime | Server-Sent Events | Supabase Realtime (+ SSE fan-out) |
| Auth | Demo personas | Supabase Auth (email/password) |
| Agent | Simulated runner | Vercel AI SDK + OpenAI (optional Inngest queue) |

## Run locally

```bash
npm install
cp .env.example .env.local   # optional — leave empty for demo mode
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

## Production setup

### 1. Vercel

1. Claim / import this repo into a Vercel project.
2. Set environment variables from `.env.example` in the Vercel project settings.
3. Deploy (`vercel --prod` or git push).

Cloud Agent deploys need a `VERCEL_TOKEN` in the environment (create at vercel.com/account/tokens).

### 2. Supabase

1. Create a Supabase project.
2. Run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) in the SQL editor.
3. Enable Email auth under Authentication.
4. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server only).
5. Optionally mirror URL + anon key as `NEXT_PUBLIC_*` for browser Realtime.

Without these vars the app stays in local demo mode.

### 3. OpenAI agent

Set `OPENAI_API_KEY` (and optional `OPENAI_MODEL`, default `gpt-4o-mini`).  
Without it, Relay uses the built-in simulated agent.

### 4. Optional Inngest

Set `INNGEST_EVENT_KEY` to enqueue `relay/agent.run` instead of running inline. Wire an Inngest function that calls `runAgent(roomId)`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server on port **3847** |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm run deploy` | `vercel --prod` (requires login / token) |
