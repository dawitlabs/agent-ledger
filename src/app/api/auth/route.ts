import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  SUPABASE_ACCESS_COOKIE,
  SUPABASE_REFRESH_COOKIE,
  ensureProfile,
} from "@/lib/auth";
import { getPublicConfig } from "@/lib/env";
import { DEMO_USERS, colorForId, initials } from "@/lib/users";
import { getSupabaseAnon } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

export async function GET() {
  const config = getPublicConfig();
  return NextResponse.json({
    users: DEMO_USERS,
    authMode: config.authMode,
    agentMode: config.agentMode,
    dataMode: config.dataMode,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    email?: string;
    password?: string;
    name?: string;
    mode?: "demo" | "signin" | "signup";
  };

  const config = getPublicConfig();

  // Supabase email/password
  if (
    config.authMode === "supabase" &&
    (body.mode === "signin" || body.mode === "signup") &&
    body.email &&
    body.password
  ) {
    const supabase = getSupabaseAnon();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase auth is not configured" },
        { status: 500 },
      );
    }

    if (body.mode === "signup") {
      const name = body.name?.trim() || body.email.split("@")[0];
      const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
          data: {
            full_name: name,
            color: colorForId(body.email),
            initials: initials(name),
          },
        },
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (!data.session || !data.user) {
        return NextResponse.json({
          user: null,
          needsConfirmation: true,
          message: "Check your email to confirm your account.",
        });
      }
      const user = toUser(data.user);
      await ensureProfile(user);
      return setSessionCookies(
        NextResponse.json({ user }),
        data.session.access_token,
        data.session.refresh_token,
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Sign-in failed" },
        { status: 400 },
      );
    }
    const user = toUser(data.user);
    await ensureProfile(user);
    return setSessionCookies(
      NextResponse.json({ user }),
      data.session.access_token,
      data.session.refresh_token,
    );
  }

  // Demo personas (always available as fallback / local mode)
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
  res.cookies.set(SUPABASE_ACCESS_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(SUPABASE_REFRESH_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  const supabase = getSupabaseAnon();
  if (supabase) {
    await supabase.auth.signOut().catch(() => undefined);
  }
  return res;
}

function toUser(u: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): User {
  const meta = u.user_metadata ?? {};
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    u.email?.split("@")[0] ||
    "User";
  return {
    id: u.id,
    name,
    email: u.email ?? `${u.id}@relay.local`,
    color: (meta.color as string) || colorForId(u.id),
    initials: (meta.initials as string) || initials(name),
  };
}

function setSessionCookies(
  res: NextResponse,
  access: string,
  refresh: string,
) {
  res.cookies.set(SUPABASE_ACCESS_COOKIE, access, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set(SUPABASE_REFRESH_COOKIE, refresh, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
