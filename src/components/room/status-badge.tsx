import type { RoomStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABELS: Record<RoomStatus, string> = {
  idle: "idle",
  running: "live",
  paused: "paused",
  completed: "done",
  failed: "failed",
};

export function StatusBadge({
  status,
  className,
}: {
  status: RoomStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border-2 border-foreground bg-secondary px-2 py-0.5 font-pixel text-[9px] uppercase shadow-pixel",
        className,
      )}
    >
      {status === "running" ? (
        <span className="size-1.5 animate-presence bg-foreground" />
      ) : null}
      {LABELS[status]}
    </span>
  );
}
