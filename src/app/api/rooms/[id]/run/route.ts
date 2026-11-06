import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAgentRunning } from "@/lib/agent-runner";
import { enqueueAgentRun } from "@/lib/agent-workflow";
import { appendEvent, getRoom, setStatus } from "@/lib/store";

export async function POST(
  _request: Request,
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
  if (isAgentRunning(id) || room.status === "running") {
    return NextResponse.json({ ok: true, alreadyRunning: true });
  }

  await appendEvent(id, {
    kind: "human",
    actorId: user.id,
    actorName: user.name,
    title: "Agent launched",
    body: room.prompt,
  });
  await setStatus(id, "running");

  const result = await enqueueAgentRun(id);
  return NextResponse.json({ ok: true, ...result });
}
