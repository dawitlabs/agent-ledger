import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type {
  Member,
  PresenceUser,
  Role,
  Room,
  RoomStatus,
  TimelineEvent,
  User,
} from "@/lib/types";
import { DEMO_USERS, initials } from "@/lib/users";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "rooms.json");

type Listener = (roomId: string, payload: unknown) => void;

interface StoreState {
  rooms: Record<string, Room>;
  presence: Record<string, PresenceUser[]>;
  listeners: Set<Listener>;
}

declare global {
  // eslint-disable-next-line no-var
  var __relayStore: StoreState | undefined;
}

function getState(): StoreState {
  if (!globalThis.__relayStore) {
    globalThis.__relayStore = {
      rooms: {},
      presence: {},
      listeners: new Set(),
    };
  }
  return globalThis.__relayStore;
}

let loadPromise: Promise<void> | null = null;

async function ensureLoaded() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw) as { rooms: Record<string, Room> };
      const state = getState();
      state.rooms = parsed.rooms ?? {};
      if (Object.keys(state.rooms).length === 0) {
        seedDemoRooms(state);
        await persist();
      }
    } catch {
      const state = getState();
      if (Object.keys(state.rooms).length === 0) {
        seedDemoRooms(state);
        await persist();
      }
    }
  })();
  return loadPromise;
}

async function persist() {
  const state = getState();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify({ rooms: state.rooms }, null, 2),
    "utf8",
  );
}

function emit(roomId: string, payload: unknown) {
  for (const listener of getState().listeners) {
    try {
      listener(roomId, payload);
    } catch {
      /* ignore broken listeners */
    }
  }
}

/** Used by the Supabase store to fan out to in-process SSE subscribers. */
export function emitExternal(roomId: string, payload: unknown) {
  emit(roomId, payload);
}

function seedDemoRooms(state: StoreState) {
  const owner = DEMO_USERS[0];
  const now = new Date().toISOString();
  const room: Room = {
    id: "room_demo_research",
    slug: "founding-strategy-sprint",
    title: "Founding strategy sprint",
    prompt:
      "Research competitor positioning for multiplayer AI workspaces and draft a 1-page strategy brief for our founding team. Focus on live steering, handoff, and shared history.",
    status: "completed",
    ownerId: owner.id,
    ownerName: owner.name,
    currentOwnerId: owner.id,
    currentOwnerName: owner.name,
    members: [
      memberFrom(owner, "owner"),
      memberFrom(DEMO_USERS[1], "editor"),
      memberFrom(DEMO_USERS[2], "viewer"),
    ],
    inviteCode: "RELAY-DEMO",
    artifact: {
      title: "Strategy brief — Multiplayer AI Workspace",
      updatedAt: now,
      content: `# Strategy brief — Multiplayer AI Workspace

## Opportunity
AI tools today are single-player. Long-running agent sessions trap context with one person. Teams re-explain work constantly.

## Positioning
Relay makes agent work multiplayer: shared rooms, live progress, mid-task steering, clean handoff, and searchable history.

## Beachhead
Small founding and eng teams (5–30) already running Claude Code / Cursor / Codex daily — starting with shared research & strategy sessions.

## Differentiation
- Multiplayer is the product, not a share link
- Built for long-running tasks with steering + handoff
- History compounds into team knowledge

## Near-term bets
1. Nail the room UX (timeline + artifact + presence)
2. Measure concurrent viewers, handoffs, return sessions
3. Expand into live coding sessions once research vertical sticks
`,
    },
    events: [
      {
        id: "ev_seed_1",
        kind: "system",
        at: now,
        title: "Room created",
        body: "Demo room seeded for the Relay MVP.",
      },
      {
        id: "ev_seed_2",
        kind: "agent_plan",
        at: now,
        actorName: "Relay Agent",
        title: "Plan ready",
        body: "1) Scan competitors\n2) Extract multiplayer patterns\n3) Draft positioning\n4) Write strategy brief",
      },
      {
        id: "ev_seed_3",
        kind: "handoff",
        at: now,
        actorId: owner.id,
        actorName: owner.name,
        title: "Ownership handed to Maya Chen",
        body: "Jordan handed ownership after steering toward founding-team GTM.",
      },
      {
        id: "ev_seed_4",
        kind: "status",
        at: now,
        title: "Session completed",
        body: "Artifact ready for team review.",
      },
    ],
    plan: [
      "Scan competitor landscape",
      "Extract multiplayer patterns",
      "Draft positioning",
      "Write strategy brief",
    ],
    currentStepIndex: 4,
    pendingSteer: null,
    createdAt: now,
    updatedAt: now,
  };
  state.rooms[room.id] = room;
}

function memberFrom(user: User, role: Role): Member {
  return {
    userId: user.id,
    role,
    name: user.name,
    email: user.email,
    color: user.color,
    initials: user.initials,
  };
}

function nowIso() {
  return new Date().toISOString();
}

export async function listRooms(): Promise<Room[]> {
  await ensureLoaded();
  return Object.values(getState().rooms).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function getRoom(id: string): Promise<Room | null> {
  await ensureLoaded();
  return getState().rooms[id] ?? null;
}

export async function createRoom(input: {
  title: string;
  prompt: string;
  owner: User;
}): Promise<Room> {
  await ensureLoaded();
  const id = `room_${nanoid(10)}`;
  const createdAt = nowIso();
  const room: Room = {
    id,
    slug: input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || id,
    title: input.title,
    prompt: input.prompt,
    status: "idle",
    ownerId: input.owner.id,
    ownerName: input.owner.name,
    currentOwnerId: input.owner.id,
    currentOwnerName: input.owner.name,
    members: [memberFrom(input.owner, "owner")],
    inviteCode: nanoid(8).toUpperCase(),
    artifact: {
      title: input.title,
      content: `# ${input.title}\n\n_Waiting for the agent to begin…_\n`,
      updatedAt: createdAt,
    },
    events: [
      {
        id: `ev_${nanoid(8)}`,
        kind: "system",
        at: createdAt,
        actorId: input.owner.id,
        actorName: input.owner.name,
        title: "Room created",
        body: input.prompt,
      },
    ],
    plan: [],
    currentStepIndex: 0,
    pendingSteer: null,
    createdAt,
    updatedAt: createdAt,
  };
  getState().rooms[id] = room;
  await persist();
  emit(id, { type: "room", room });
  return room;
}

export async function updateRoom(
  id: string,
  updater: (room: Room) => Room,
): Promise<Room | null> {
  await ensureLoaded();
  const current = getState().rooms[id];
  if (!current) return null;
  const next = updater({ ...current });
  next.updatedAt = nowIso();
  getState().rooms[id] = next;
  await persist();
  emit(id, { type: "room", room: next });
  return next;
}

export async function appendEvent(
  roomId: string,
  event: Omit<TimelineEvent, "id" | "at"> & { id?: string; at?: string },
): Promise<TimelineEvent | null> {
  const full: TimelineEvent = {
    id: event.id ?? `ev_${nanoid(8)}`,
    at: event.at ?? nowIso(),
    kind: event.kind,
    title: event.title,
    body: event.body,
    actorId: event.actorId,
    actorName: event.actorName,
    meta: event.meta,
  };
  const room = await updateRoom(roomId, (r) => ({
    ...r,
    events: [...r.events, full],
  }));
  if (!room) return null;
  emit(roomId, { type: "event", event: full });
  return full;
}

export async function setStatus(roomId: string, status: RoomStatus) {
  return updateRoom(roomId, (r) => ({ ...r, status }));
}

export async function setArtifact(
  roomId: string,
  content: string,
  title?: string,
) {
  return updateRoom(roomId, (r) => ({
    ...r,
    artifact: {
      title: title ?? r.artifact.title,
      content,
      updatedAt: nowIso(),
    },
  }));
}

export async function joinRoom(
  roomId: string,
  user: User,
  role: Role = "editor",
): Promise<Room | null> {
  return updateRoom(roomId, (r) => {
    if (r.members.some((m) => m.userId === user.id)) return r;
    return {
      ...r,
      members: [...r.members, memberFrom(user, role)],
    };
  });
}

export async function addComment(
  roomId: string,
  user: User,
  body: string,
): Promise<TimelineEvent | null> {
  return appendEvent(roomId, {
    kind: "comment",
    actorId: user.id,
    actorName: user.name,
    title: "Comment",
    body,
  });
}

export async function steerRoom(
  roomId: string,
  user: User,
  message: string,
): Promise<Room | null> {
  await appendEvent(roomId, {
    kind: "steer",
    actorId: user.id,
    actorName: user.name,
    title: "Steering injected",
    body: message,
  });
  return updateRoom(roomId, (r) => ({
    ...r,
    pendingSteer: message,
    status: r.status === "completed" ? "running" : r.status,
  }));
}

export async function handoffRoom(
  roomId: string,
  from: User,
  toUserId: string,
): Promise<Room | null> {
  const room = await getRoom(roomId);
  if (!room) return null;
  const target = room.members.find((m) => m.userId === toUserId);
  if (!target) return null;
  await appendEvent(roomId, {
    kind: "handoff",
    actorId: from.id,
    actorName: from.name,
    title: `Ownership → ${target.name}`,
    body: `${from.name} handed the session to ${target.name}.`,
  });
  return updateRoom(roomId, (r) => ({
    ...r,
    currentOwnerId: target.userId,
    currentOwnerName: target.name,
  }));
}

export function subscribe(listener: Listener) {
  getState().listeners.add(listener);
  return () => getState().listeners.delete(listener);
}

export async function touchPresence(
  roomId: string,
  user: User,
  role: Role,
): Promise<PresenceUser[]> {
  await ensureLoaded();
  const state = getState();
  const now = Date.now();
  const existing = state.presence[roomId] ?? [];
  const next = existing.filter(
    (p) => p.userId !== user.id && now - p.lastSeen < 15_000,
  );
  next.push({
    userId: user.id,
    name: user.name,
    initials: user.initials || initials(user.name),
    color: user.color,
    role,
    lastSeen: now,
  });
  state.presence[roomId] = next;
  emit(roomId, { type: "presence", presence: next });
  return next;
}

export async function getPresence(roomId: string): Promise<PresenceUser[]> {
  await ensureLoaded();
  const now = Date.now();
  const list = (getState().presence[roomId] ?? []).filter(
    (p) => now - p.lastSeen < 15_000,
  );
  getState().presence[roomId] = list;
  return list;
}

export function findUser(id: string): User | undefined {
  return DEMO_USERS.find((u) => u.id === id);
}
