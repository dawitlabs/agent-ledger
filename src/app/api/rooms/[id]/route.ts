import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPresence, getRoom, joinRoom } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const room = await getRoom(id);
  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const presence = await getPresence(id);
  return NextResponse.json({ room, presence });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
  };
  if (body.action === "join") {
    const room = await joinRoom(id, user, "editor");
    if (!room) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ room });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
