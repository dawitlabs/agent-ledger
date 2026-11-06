import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createRoom, listRooms } from "@/lib/store";

export async function GET() {
  const rooms = await listRooms();
  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { title?: string; prompt?: string };
  if (!body.title?.trim() || !body.prompt?.trim()) {
    return NextResponse.json(
      { error: "Title and prompt are required" },
      { status: 400 },
    );
  }
  const room = await createRoom({
    title: body.title.trim(),
    prompt: body.prompt.trim(),
    owner: user,
  });
  return NextResponse.json({ room }, { status: 201 });
}
