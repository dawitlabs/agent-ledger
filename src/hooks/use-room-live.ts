"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { PresenceUser, Room, TimelineEvent } from "@/lib/types";

type PublicConfig = {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  dataMode: "supabase" | "local";
};

export function useRoomLive(
  roomId: string,
  initialRoom: Room,
  self?: PresenceUser | null,
) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState("");
  const [transport, setTransport] = useState<"sse" | "supabase">("sse");
  const sourceRef = useRef<EventSource | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    setRoom(initialRoom);
  }, [initialRoom]);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const res = await fetch("/api/config");
      const config = (await res.json()) as PublicConfig;
      if (cancelled) return;

      if (
        config.dataMode === "supabase" &&
        config.supabaseUrl &&
        config.supabaseAnonKey
      ) {
        setTransport("supabase");
        const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        supabaseRef.current = supabase;

        const channel = supabase
          .channel(`room:${roomId}`, {
            config: { presence: { key: roomId } },
          })
          .on("broadcast", { event: "relay" }, ({ payload }) => {
            applyPayload(payload as Record<string, unknown>);
          })
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "rooms",
              filter: `id=eq.${roomId}`,
            },
            () => {
              void refresh();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "room_events",
              filter: `room_id=eq.${roomId}`,
            },
            (change) => {
              const row = change.new as {
                id: string;
                kind: TimelineEvent["kind"];
                at: string;
                actor_id?: string;
                actor_name?: string;
                title: string;
                body?: string;
                meta?: Record<string, string>;
              };
              const event: TimelineEvent = {
                id: row.id,
                kind: row.kind,
                at: row.at,
                actorId: row.actor_id,
                actorName: row.actor_name,
                title: row.title,
                body: row.body,
                meta: row.meta,
              };
              setRoom((prev) => {
                if (prev.events.some((e) => e.id === event.id)) return prev;
                return { ...prev, events: [...prev.events, event] };
              });
            },
          )
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            const list: PresenceUser[] = [];
            for (const key of Object.keys(state)) {
              for (const raw of state[key] as unknown as PresenceUser[]) {
                if (raw?.userId) list.push(raw);
              }
            }
            setPresence(list);
          })
          .subscribe(async (status) => {
            setConnected(status === "SUBSCRIBED");
            if (status === "SUBSCRIBED") {
              await refresh();
              if (self) {
                await channel.track(self);
              }
            }
          });

        channelRef.current = channel;
        return;
      }

      // SSE fallback (local / demo)
      setTransport("sse");
      const es = new EventSource(`/api/rooms/${roomId}/events`);
      sourceRef.current = es;
      es.onopen = () => setConnected(true);
      es.onerror = () => setConnected(false);
      es.onmessage = (message) => {
        try {
          applyPayload(JSON.parse(message.data) as Record<string, unknown>);
        } catch {
          /* ignore */
        }
      };
    }

    function applyPayload(data: Record<string, unknown>) {
      if ((data.type === "hello" || data.type === "room") && data.room) {
        setRoom(data.room as Room);
        if (data.presence) setPresence(data.presence as PresenceUser[]);
      }
      if (data.type === "event" && data.event) {
        const event = data.event as TimelineEvent;
        setRoom((prev) => {
          if (prev.events.some((e) => e.id === event.id)) return prev;
          return { ...prev, events: [...prev.events, event] };
        });
      }
      if (data.type === "presence" && data.presence) {
        setPresence(data.presence as PresenceUser[]);
      }
    }

    void connect();

    return () => {
      cancelled = true;
      sourceRef.current?.close();
      sourceRef.current = null;
      if (channelRef.current) {
        void supabaseRef.current?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) return;
    const data = (await res.json()) as { room: Room; presence: PresenceUser[] };
    setRoom(data.room);
    setPresence(data.presence);
  }, [roomId]);

  const filteredEvents = query.trim()
    ? room.events.filter((e) => {
        const q = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.body?.toLowerCase().includes(q) ||
          e.actorName?.toLowerCase().includes(q) ||
          e.kind.includes(q)
        );
      })
    : room.events;

  return {
    room,
    setRoom,
    presence,
    connected,
    query,
    setQuery,
    filteredEvents,
    refresh,
    transport,
  };
}
