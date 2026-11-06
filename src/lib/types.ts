export type Role = "owner" | "editor" | "viewer";

export type RoomStatus = "idle" | "running" | "paused" | "completed" | "failed";

export type EventKind =
  | "system"
  | "human"
  | "agent_plan"
  | "agent_step"
  | "agent_tool"
  | "agent_output"
  | "steer"
  | "handoff"
  | "comment"
  | "status";

export interface User {
  id: string;
  name: string;
  email: string;
  color: string;
  initials: string;
}

export interface PresenceUser {
  userId: string;
  name: string;
  initials: string;
  color: string;
  role: Role;
  lastSeen: number;
}

export interface TimelineEvent {
  id: string;
  kind: EventKind;
  at: string;
  actorId?: string;
  actorName?: string;
  title: string;
  body?: string;
  meta?: Record<string, string>;
}

export interface Artifact {
  title: string;
  content: string;
  updatedAt: string;
}

export interface Member {
  userId: string;
  role: Role;
  name: string;
  email: string;
  color: string;
  initials: string;
}

export interface Room {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  status: RoomStatus;
  ownerId: string;
  ownerName: string;
  currentOwnerId: string;
  currentOwnerName: string;
  members: Member[];
  inviteCode: string;
  artifact: Artifact;
  events: TimelineEvent[];
  plan: string[];
  currentStepIndex: number;
  pendingSteer?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser extends User {
  roleHint?: Role;
}
