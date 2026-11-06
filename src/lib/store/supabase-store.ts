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
import { initials } from "@/lib/users";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import * as memory from "@/lib/store/memory";

type Listener = (roomId: string, payload: unknown) => void;

type RoomRow = {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  status: RoomStatus;
  owner_id: string;
  owner_name: string;
  current_owner_id: string;
  current_owner_name: string;
  invite_code: string;
  artifact_title: string;
  artifact_content: string;
  artifact_updated_at: string;
  plan: string[];
  current_step_index: number;
  pending_steer: string | null;
  created_at: string;
  updated_at: string;
};

type MemberRow = {
  room_id: string;
  user_id: string;
  role: Role;
  name: string;
  email: string;
  color: string;
  initials: string;
};

type EventRow = {
  id: string;
  room_id: string;
  kind: TimelineEvent["kind"];
  at: string;
  actor_id: string | null;
  actor_name: string | null;
  title: string;
  body: string | null;
  meta: Record<string, string> | null;
};

function db() {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("Supabase is not configured");
  return client;
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

function rowToRoom(
  row: RoomRow,
  members: MemberRow[],
  events: EventRow[],
): Room {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    prompt: row.prompt,
    status: row.status,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    currentOwnerId: row.current_owner_id,
    currentOwnerName: row.current_owner_name,
    inviteCode: row.invite_code,
    artifact: {
      title: row.artifact_title,
      content: row.artifact_content,
      updatedAt: row.artifact_updated_at,
    },
    plan: row.plan ?? [],
    currentStepIndex: row.current_step_index,
    pendingSteer: row.pending_steer,
    members: members.map((m) => ({
      userId: m.user_id,
      role: m.role,
      name: m.name,
      email: m.email,
      color: m.color,
      initials: m.initials,
    })),
    events: events.map((e) => ({
      id: e.id,
      kind: e.kind,
      at: e.at,
      actorId: e.actor_id ?? undefined,
      actorName: e.actor_name ?? undefined,
      title: e.title,
      body: e.body ?? undefined,
      meta: e.meta ?? undefined,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadRoom(id: string): Promise<Room | null> {
  const supabase = db();
  const { data: row, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) return null;

  const [{ data: members }, { data: events }] = await Promise.all([
    supabase.from("room_members").select("*").eq("room_id", id),
    supabase
      .from("room_events")
      .select("*")
      .eq("room_id", id)
      .order("at", { ascending: true }),
  ]);

  return rowToRoom(
    row as RoomRow,
    (members ?? []) as MemberRow[],
    (events ?? []) as EventRow[],
  );
}

async function broadcast(roomId: string, payload: unknown) {
  // Keep in-process SSE subscribers in sync
  memory.emitExternal(roomId, payload);
  try {
    const supabase = db();
    await supabase.channel(`room:${roomId}`).send({
      type: "broadcast",
      event: "relay",
      payload,
    });
  } catch {
    /* channel send is best-effort */
  }
}

export async function listRooms(): Promise<Room[]> {
  const supabase = db();
  const { data: rows, error } = await supabase
    .from("rooms")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !rows) return [];

  const rooms: Room[] = [];
  for (const row of rows as RoomRow[]) {
    const room = await loadRoom(row.id);
    if (room) rooms.push(room);
  }
  return rooms;
}

export async function getRoom(id: string): Promise<Room | null> {
  return loadRoom(id);
}

export async function createRoom(input: {
  title: string;
  prompt: string;
  owner: User;
}): Promise<Room> {
  const supabase = db();
  const id = `room_${nanoid(10)}`;
  const createdAt = new Date().toISOString();
  const slug =
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || id;
  const inviteCode = nanoid(8).toUpperCase();
  const owner = memberFrom(input.owner, "owner");
  const eventId = `ev_${nanoid(8)}`;

  const { error: roomErr } = await supabase.from("rooms").insert({
    id,
    slug,
    title: input.title,
    prompt: input.prompt,
    status: "idle",
    owner_id: input.owner.id,
    owner_name: input.owner.name,
    current_owner_id: input.owner.id,
    current_owner_name: input.owner.name,
    invite_code: inviteCode,
    artifact_title: input.title,
    artifact_content: `# ${input.title}\n\n_Waiting for the agent to begin…_\n`,
    artifact_updated_at: createdAt,
    plan: [],
    current_step_index: 0,
    pending_steer: null,
    created_at: createdAt,
    updated_at: createdAt,
  });
  if (roomErr) throw roomErr;

  await supabase.from("room_members").insert({
    room_id: id,
    user_id: owner.userId,
    role: owner.role,
    name: owner.name,
    email: owner.email,
    color: owner.color,
    initials: owner.initials,
  });

  await supabase.from("room_events").insert({
    id: eventId,
    room_id: id,
    kind: "system",
    at: createdAt,
    actor_id: input.owner.id,
    actor_name: input.owner.name,
    title: "Room created",
    body: input.prompt,
    meta: {},
  });

  const room = (await loadRoom(id))!;
  await broadcast(id, { type: "room", room });
  return room;
}

export async function updateRoom(
  id: string,
  updater: (room: Room) => Room,
): Promise<Room | null> {
  const current = await loadRoom(id);
  if (!current) return null;
  const next = updater({ ...current });
  next.updatedAt = new Date().toISOString();

  const supabase = db();
  const { error } = await supabase
    .from("rooms")
    .update({
      slug: next.slug,
      title: next.title,
      prompt: next.prompt,
      status: next.status,
      owner_id: next.ownerId,
      owner_name: next.ownerName,
      current_owner_id: next.currentOwnerId,
      current_owner_name: next.currentOwnerName,
      invite_code: next.inviteCode,
      artifact_title: next.artifact.title,
      artifact_content: next.artifact.content,
      artifact_updated_at: next.artifact.updatedAt,
      plan: next.plan,
      current_step_index: next.currentStepIndex,
      pending_steer: next.pendingSteer ?? null,
      updated_at: next.updatedAt,
    })
    .eq("id", id);
  if (error) throw error;

  // Sync members (simple replace of missing ones)
  for (const m of next.members) {
    await supabase.from("room_members").upsert({
      room_id: id,
      user_id: m.userId,
      role: m.role,
      name: m.name,
      email: m.email,
      color: m.color,
      initials: m.initials,
    });
  }

  const room = (await loadRoom(id))!;
  await broadcast(id, { type: "room", room });
  return room;
}

export async function appendEvent(
  roomId: string,
  event: Omit<TimelineEvent, "id" | "at"> & { id?: string; at?: string },
): Promise<TimelineEvent | null> {
  const full: TimelineEvent = {
    id: event.id ?? `ev_${nanoid(8)}`,
    at: event.at ?? new Date().toISOString(),
    kind: event.kind,
    title: event.title,
    body: event.body,
    actorId: event.actorId,
    actorName: event.actorName,
    meta: event.meta,
  };

  const supabase = db();
  const { error } = await supabase.from("room_events").insert({
    id: full.id,
    room_id: roomId,
    kind: full.kind,
    at: full.at,
    actor_id: full.actorId ?? null,
    actor_name: full.actorName ?? null,
    title: full.title,
    body: full.body ?? null,
    meta: full.meta ?? {},
  });
  if (error) throw error;

  await supabase
    .from("rooms")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", roomId);

  await broadcast(roomId, { type: "event", event: full });
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
      updatedAt: new Date().toISOString(),
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
    return { ...r, members: [...r.members, memberFrom(user, role)] };
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
  return memory.subscribe(listener);
}

export async function touchPresence(
  roomId: string,
  user: User,
  role: Role,
): Promise<PresenceUser[]> {
  // Presence stays in-process + broadcast (Supabase Presence tracked client-side too)
  const list = await memory.touchPresence(roomId, user, role);
  await broadcast(roomId, { type: "presence", presence: list });
  return list;
}

export async function getPresence(roomId: string): Promise<PresenceUser[]> {
  return memory.getPresence(roomId);
}

export function findUser(id: string): User | undefined {
  return memory.findUser(id);
}

export function initialsOf(name: string) {
  return initials(name);
}
