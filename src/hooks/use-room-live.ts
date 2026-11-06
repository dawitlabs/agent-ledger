"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PresenceUser, Room, TimelineEvent } from "@/lib/types";

export function useRoomLive(roomId: string, initialRoom: Room) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState("");
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setRoom(initialRoom);
  }, [initialRoom]);

  useEffect(() => {
    const es = new EventSource(`/api/rooms/${roomId}/events`);
    sourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as {
          type: string;
          room?: Room;
          event?: TimelineEvent;
          presence?: PresenceUser[];
        };
        if (data.type === "hello" && data.room) {
          setRoom(data.room);
          if (data.presence) setPresence(data.presence);
        }
        if (data.type === "room" && data.room) {
          setRoom(data.room);
        }
        if (data.type === "event" && data.event) {
          setRoom((prev) => {
            if (prev.events.some((e) => e.id === data.event!.id)) return prev;
            return { ...prev, events: [...prev.events, data.event!] };
          });
        }
        if (data.type === "presence" && data.presence) {
          setPresence(data.presence);
        }
      } catch {
        /* ignore malformed */
      }
    };

    return () => {
      es.close();
      sourceRef.current = null;
    };
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
  };
}
