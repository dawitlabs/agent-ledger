"use client";

import { useMemo, useState } from "react";
import {
  HandMetal,
  MessageSquare,
  Play,
  Radar,
  Send,
  UserRoundCog,
} from "lucide-react";
import { useRoomLive } from "@/hooks/use-room-live";
import type { Room, User } from "@/lib/types";
import { PixelBadge, PixelFrame } from "@/components/pixel/pixel-frame";
import { StatusBadge } from "@/components/room/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function RoomView({
  initialRoom,
  user,
}: {
  initialRoom: Room;
  user: User;
}) {
  const memberHint = initialRoom.members.find((m) => m.userId === user.id);
  const {
    room,
    presence,
    connected,
    query,
    setQuery,
    filteredEvents,
    refresh,
    transport,
  } = useRoomLive(
    initialRoom.id,
    initialRoom,
    memberHint
      ? {
          userId: user.id,
          name: user.name,
          initials: user.initials,
          color: user.color,
          role: memberHint.role,
          lastSeen: Date.now(),
        }
      : {
          userId: user.id,
          name: user.name,
          initials: user.initials,
          color: user.color,
          role: "viewer",
          lastSeen: Date.now(),
        },
  );

  const [steer, setSteer] = useState("");
  const [comment, setComment] = useState("");
  const [handoffTo, setHandoffTo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const member = room.members.find((m) => m.userId === user.id);
  const canEdit = member && member.role !== "viewer";
  const canHandoff =
    member &&
    (member.role === "owner" || user.id === room.currentOwnerId);

  const others = useMemo(
    () => room.members.filter((m) => m.userId !== user.id),
    [room.members, user.id],
  );

  async function ensureJoined() {
    if (member) return true;
    setBusy("join");
    const res = await fetch(`/api/rooms/${room.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join" }),
    });
    setBusy(null);
    if (!res.ok) {
      setBanner("Could not join room.");
      return false;
    }
    await refresh();
    return true;
  }

  async function launch() {
    if (!(await ensureJoined())) return;
    setBusy("run");
    setBanner(null);
    const res = await fetch(`/api/rooms/${room.id}/run`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setBanner(data.error ?? "Could not launch agent");
    }
  }

  async function sendSteer() {
    if (!steer.trim()) return;
    if (!(await ensureJoined())) return;
    setBusy("steer");
    const res = await fetch(`/api/rooms/${room.id}/steer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: steer.trim() }),
    });
    setBusy(null);
    if (!res.ok) {
      setBanner("Steering failed — check your role.");
      return;
    }
    setSteer("");
    setBanner("Steering injected into the live run.");
  }

  async function sendComment() {
    if (!comment.trim()) return;
    if (!(await ensureJoined())) return;
    setBusy("comment");
    const res = await fetch(`/api/rooms/${room.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: comment.trim() }),
    });
    setBusy(null);
    if (!res.ok) {
      setBanner("Comment failed.");
      return;
    }
    setComment("");
  }

  async function doHandoff() {
    if (!handoffTo) return;
    setBusy("handoff");
    const res = await fetch(`/api/rooms/${room.id}/handoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: handoffTo }),
    });
    setBusy(null);
    if (!res.ok) {
      setBanner("Handoff failed — only owners / current owner can transfer.");
      return;
    }
    setBanner("Ownership transferred.");
    setHandoffTo("");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-4 border-b-2 border-foreground pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={room.status} />
            <PixelBadge className="bg-background">
              {connected
                ? transport === "supabase"
                  ? "supabase live"
                  : "realtime"
                : "reconnecting"}
            </PixelBadge>
            {member ? (
              <PixelBadge className="bg-background">{member.role}</PixelBadge>
            ) : (
              <PixelBadge className="bg-background">guest</PixelBadge>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {room.title}
          </h1>
          <p className="mt-2 max-w-3xl font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
            {room.prompt}
          </p>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Session owner · {room.currentOwnerName} · invite {room.inviteCode}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <PresenceStack presence={presence} />
          <div className="flex flex-wrap gap-2">
            {!member ? (
              <Button
                onClick={() => void ensureJoined()}
                disabled={busy === "join"}
                className="border-2 border-foreground shadow-pixel"
              >
                Join room
              </Button>
            ) : null}
            <Button
              onClick={() => void launch()}
              disabled={!canEdit && !!member}
              className="border-2 border-foreground shadow-pixel"
            >
              <Play className="size-4" />
              {room.status === "running"
                ? "Running…"
                : room.status === "completed"
                  ? "Rerun agent"
                  : "Launch agent"}
            </Button>
          </div>
        </div>
      </div>

      {banner ? (
        <div className="mt-4 border-2 border-foreground bg-secondary px-3 py-2 font-mono text-sm shadow-pixel">
          {banner}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <PixelFrame className="bg-card">
          <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3">
            <div className="flex items-center gap-2">
              <Radar className="size-4" />
              <h2 className="font-display text-lg font-bold">Live timeline</h2>
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history…"
              className="h-8 max-w-[180px] border-2 border-foreground font-mono text-xs"
            />
          </div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto p-4">
            {filteredEvents.length === 0 ? (
              <p className="font-mono text-sm text-muted-foreground">
                No matching events.
              </p>
            ) : (
              [...filteredEvents].reverse().map((event) => (
                <article
                  key={event.id}
                  className="animate-step-in border border-foreground/20 bg-muted/40 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-pixel text-[8px] uppercase text-muted-foreground">
                      {event.kind.replace("_", " ")}
                    </span>
                    <span className="font-display text-sm font-semibold">
                      {event.title}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {new Date(event.at).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZone: "Africa/Addis_Ababa",
                      })}{" "}
                      EAT
                    </span>
                  </div>
                  {event.actorName ? (
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {event.actorName}
                    </p>
                  ) : null}
                  {event.body ? (
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                      {event.body}
                    </pre>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </PixelFrame>

        <div className="space-y-5">
          <PixelFrame className="bg-card">
            <div className="border-b-2 border-foreground px-4 py-3">
              <h2 className="font-display text-lg font-bold">Shared artifact</h2>
              <p className="font-mono text-[11px] text-muted-foreground">
                Updated{" "}
                {new Date(room.artifact.updatedAt).toLocaleString("en-GB", {
                  timeZone: "Africa/Addis_Ababa",
                })}{" "}
                EAT
              </p>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-4">
              <ArtifactMarkdown content={room.artifact.content} />
            </div>
            {room.plan.length > 0 ? (
              <div className="border-t-2 border-foreground bg-secondary/40 px-4 py-3">
                <p className="font-pixel text-[9px] uppercase text-muted-foreground">
                  Plan
                </p>
                <ol className="mt-2 space-y-1">
                  {room.plan.map((step, i) => (
                    <li
                      key={step}
                      className={cn(
                        "font-mono text-xs",
                        i < room.currentStepIndex && "text-muted-foreground line-through",
                        i === room.currentStepIndex &&
                          room.status === "running" &&
                          "font-semibold",
                      )}
                    >
                      {i + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </PixelFrame>

          <PixelFrame className="bg-card p-4">
            <Tabs defaultValue="steer">
              <TabsList className="grid w-full grid-cols-3 border-2 border-foreground bg-secondary">
                <TabsTrigger value="steer">Steer</TabsTrigger>
                <TabsTrigger value="handoff">Handoff</TabsTrigger>
                <TabsTrigger value="comment">Comment</TabsTrigger>
              </TabsList>

              <TabsContent value="steer" className="mt-4 space-y-3">
                <p className="font-mono text-xs text-muted-foreground">
                  Inject direction mid-run. Editors and owners can redirect the
                  agent without restarting from scratch.
                </p>
                <Textarea
                  value={steer}
                  onChange={(e) => setSteer(e.target.value)}
                  placeholder='e.g. "Focus on founding-team GTM, skip enterprise for now"'
                  className="border-2 border-foreground font-mono text-sm shadow-pixel"
                  rows={3}
                  disabled={!canEdit && !!member}
                />
                <Button
                  onClick={() => void sendSteer()}
                  disabled={(!canEdit && !!member) || busy === "steer"}
                  className="border-2 border-foreground shadow-pixel"
                >
                  <Send className="size-4" />
                  Inject steering
                </Button>
              </TabsContent>

              <TabsContent value="handoff" className="mt-4 space-y-3">
                <p className="font-mono text-xs text-muted-foreground">
                  Pass session ownership. The full timeline travels with the
                  handoff.
                </p>
                <Select value={handoffTo} onValueChange={setHandoffTo}>
                  <SelectTrigger className="border-2 border-foreground shadow-pixel">
                    <SelectValue placeholder="Choose teammate" />
                  </SelectTrigger>
                  <SelectContent>
                    {others.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.name} · {m.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => void doHandoff()}
                  disabled={!canHandoff || !handoffTo || busy === "handoff"}
                  className="border-2 border-foreground shadow-pixel"
                >
                  <HandMetal className="size-4" />
                  Transfer ownership
                </Button>
              </TabsContent>

              <TabsContent value="comment" className="mt-4 space-y-3">
                <p className="font-mono text-xs text-muted-foreground">
                  Annotate the session. Comments land on the shared timeline.
                </p>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Leave a note for the team…"
                  className="border-2 border-foreground font-mono text-sm shadow-pixel"
                  rows={3}
                />
                <Button
                  onClick={() => void sendComment()}
                  disabled={busy === "comment"}
                  className="border-2 border-foreground shadow-pixel"
                >
                  <MessageSquare className="size-4" />
                  Add comment
                </Button>
              </TabsContent>
            </Tabs>
          </PixelFrame>

          <PixelFrame className="bg-card p-4">
            <div className="flex items-center gap-2">
              <UserRoundCog className="size-4" />
              <h3 className="font-display text-base font-bold">Members</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {room.members.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center gap-3 border border-foreground/15 px-2 py-1.5"
                >
                  <span
                    className="flex size-7 items-center justify-center border-2 border-foreground font-pixel text-[8px] text-background"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {m.name}
                      {m.userId === room.currentOwnerId ? " · session owner" : ""}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {m.role}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </PixelFrame>
        </div>
      </div>
    </main>
  );
}

function PresenceStack({
  presence,
}: {
  presence: { userId: string; name: string; initials: string; color: string }[];
}) {
  if (presence.length === 0) {
    return (
      <p className="font-mono text-xs text-muted-foreground">No one watching yet</p>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {presence.slice(0, 6).map((p, i) => (
          <span
            key={p.userId}
            title={p.name}
            className="flex size-8 items-center justify-center border-2 border-foreground font-pixel text-[8px] text-background"
            style={{ backgroundColor: p.color, zIndex: 6 - i }}
          >
            {p.initials}
          </span>
        ))}
      </div>
      <span className="font-mono text-xs text-muted-foreground">
        {presence.length} watching
      </span>
    </div>
  );
}

function ArtifactMarkdown({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.startsWith("# ")) {
          return (
            <h3 key={i} className="font-display text-xl font-bold">
              {block.replace(/^#\s+/, "")}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h4 key={i} className="font-display text-base font-bold">
              {block.replace(/^##\s+/, "")}
            </h4>
          );
        }
        if (block.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-foreground bg-secondary/50 px-3 py-2 font-mono text-xs"
            >
              {block.replace(/^>\s+/, "")}
            </blockquote>
          );
        }
        if (block.startsWith("- ") || block.startsWith("1.")) {
          return (
            <ul key={i} className="space-y-1 font-mono text-xs leading-relaxed">
              {block.split("\n").map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          );
        }
        if (block.startsWith("_") && block.endsWith("_")) {
          return (
            <p key={i} className="font-mono text-xs italic text-muted-foreground">
              {block.slice(1, -1)}
            </p>
          );
        }
        return (
          <p key={i} className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {block}
          </p>
        );
      })}
    </div>
  );
}
