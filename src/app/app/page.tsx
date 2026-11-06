import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listRooms } from "@/lib/store";
import { PixelBadge, PixelFrame } from "@/components/pixel/pixel-frame";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/room/status-badge";

export default async function AppHomePage() {
  const user = await getCurrentUser();
  const rooms = await listRooms();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-pixel text-[10px] uppercase text-muted-foreground">
            Workspace
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Rooms
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Shared agent sessions for {user?.name.split(" ")[0]}. Open a room to
            watch live progress, steer mid-run, or take ownership.
          </p>
        </div>
        <Button
          asChild
          className="border-2 border-foreground shadow-pixel hover:translate-x-px hover:translate-y-px hover:shadow-none"
        >
          <Link href="/app/rooms/new">
            <Plus className="size-4" />
            New room
          </Link>
        </Button>
      </div>

      {rooms.length === 0 ? (
        <PixelFrame className="mt-10 bg-card p-8 text-center">
          <p className="font-display text-xl font-semibold">No rooms yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a room, paste a prompt, and invite teammates to watch.
          </p>
          <Button asChild className="mt-6 border-2 border-foreground shadow-pixel">
            <Link href="/app/rooms/new">Create first room</Link>
          </Button>
        </PixelFrame>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {rooms.map((room) => {
            const member = room.members.find((m) => m.userId === user?.id);
            return (
              <Link key={room.id} href={`/app/rooms/${room.id}`} className="group">
                <PixelFrame className="h-full bg-card p-5 transition group-hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-xl font-bold">
                        {room.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 font-mono text-xs text-muted-foreground">
                        {room.prompt}
                      </p>
                    </div>
                    <StatusBadge status={room.status} />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <PixelBadge>
                      {room.members.length} member
                      {room.members.length === 1 ? "" : "s"}
                    </PixelBadge>
                    {member ? (
                      <PixelBadge className="bg-background">{member.role}</PixelBadge>
                    ) : (
                      <PixelBadge className="bg-background">join</PixelBadge>
                    )}
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                      Owner · {room.currentOwnerName.split(" ")[0]}
                    </span>
                  </div>
                </PixelFrame>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
