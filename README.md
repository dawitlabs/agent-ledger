# Relay — Multiplayer AI Workspace

A real-time collaborative workspace where humans and AI agents work on the same long-running tasks together. Anyone can watch progress live, redirect mid-run, hand off ownership, and keep a shared audit trail that becomes team knowledge.

## Features (MVP)

- **Shared rooms** — create a session, invite teammates, launch an agent from a prompt
- **Live agent progress** — plan, steps, tool calls, and artifact updates stream over SSE
- **Presence** — see who is watching the room
- **Mid-task steering** — inject direction without restarting
- **Handoff** — transfer session ownership with full history intact
- **Shared history** — searchable timeline of human + agent actions
- **Artifact view** — one primary document the agent updates live
- **Roles** — owner / editor / viewer (demo auth via teammate personas)

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Motion for landing animations
- Server-Sent Events for realtime progress + presence
- File-backed room store (swap for Supabase Postgres + Realtime in production)
- Demo agent runner (replace with Vercel AI SDK + Workflow / Inngest for production)

## Aesthetic

Mono charcoal theme with soft one-color gradients, hard pixel shadows, and selective pixel typography — intentional agent/room accents on a clean product UI.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

1. Open **Workspace** / sign in as a demo teammate  
2. Create a room (or open the seeded demo room)  
3. Launch the agent and open the same room in another browser profile to see presence  
4. Steer mid-run or hand off ownership

## Production notes

This MVP uses an in-process + `.data/rooms.json` store and a simulated agent so it runs without API keys. For production:

- Supabase Postgres + RLS for rooms/history
- Supabase Realtime or Liveblocks for presence/broadcast
- Clerk or Supabase Auth for orgs/roles
- Vercel AI SDK + Workflow/Inngest for durable long-running agents

## Scripts

| Script        | Description                |
| ------------- | -------------------------- |
| `npm run dev` | Dev server on port **3847** |
| `npm run build` | Production build         |
| `npm start`   | Start production server    |
| `npm run lint` | ESLint                    |
