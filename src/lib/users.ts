import type { User } from "@/lib/types";

const PALETTE = [
  "#1a1a1a",
  "#2d2d2d",
  "#404040",
  "#525252",
  "#0f172a",
  "#1e293b",
  "#334155",
  "#475569",
];

export const DEMO_USERS: User[] = [
  {
    id: "u_maya",
    name: "Maya Chen",
    email: "maya@relay.dev",
    color: "#111111",
    initials: "MC",
  },
  {
    id: "u_jordan",
    name: "Jordan Hale",
    email: "jordan@relay.dev",
    color: "#2a2a2a",
    initials: "JH",
  },
  {
    id: "u_sam",
    name: "Sam Okonkwo",
    email: "sam@relay.dev",
    color: "#3d3d3d",
    initials: "SO",
  },
  {
    id: "u_riley",
    name: "Riley Park",
    email: "riley@relay.dev",
    color: "#555555",
    initials: "RP",
  },
];

export function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
