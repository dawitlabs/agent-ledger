import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRoom, handoffRoom } from "@/lib/store";

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
  if (!member || (member.role !== "owner" && user.id !== room.currentOwnerId)) {
    // editors who currently own OR room owner can hand off
    if (member?.role === "viewer" || !member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.id !== room.currentOwnerId && member.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = (await request.json()) as { toUserId?: string };
  if (!body.toUserId) {
    return NextResponse.json({ error: "toUserId required" }, { status: 400 });
  }

  const updated = await handoffRoom(id, user, body.toUserId);
  if (!updated) {
    return NextResponse.json({ error: "Handoff failed" }, { status: 400 });
  }
  return NextResponse.json({ room: updated });
}
