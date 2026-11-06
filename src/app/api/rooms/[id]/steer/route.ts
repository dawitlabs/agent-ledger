import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAgentRunning, runAgent } from "@/lib/agent-runner";
import { getRoom, steerRoom } from "@/lib/store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const room = await getRoom(id);
  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const member = room.members.find((m) => m.userId === user.id);
  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as { message?: string };
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const updated = await steerRoom(id, user, body.message.trim());
  if (
    updated &&
    (updated.status === "idle" ||
      updated.status === "completed" ||
      updated.status === "paused") &&
    !isAgentRunning(id)
  ) {
    void runAgent(id);
  }

  return NextResponse.json({ room: updated });
}
