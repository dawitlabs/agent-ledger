import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { DEMO_USERS } from "@/lib/users";

export async function GET() {
  return NextResponse.json({ users: DEMO_USERS });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string };
  const user = DEMO_USERS.find((u) => u.id === body.userId);
  if (!user) {
    return NextResponse.json({ error: "Unknown user" }, { status: 400 });
  }
  const res = NextResponse.json({ user });
  res.cookies.set(AUTH_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
