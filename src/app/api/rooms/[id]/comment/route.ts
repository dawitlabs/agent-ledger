import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addComment, getRoom } from "@/lib/store";

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
  if (!room.members.some((m) => m.userId === user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as { body?: string };
  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Comment required" }, { status: 400 });
  }
  const event = await addComment(id, user, body.body.trim());
  return NextResponse.json({ event });
}
