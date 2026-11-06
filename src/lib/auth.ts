import { cookies } from "next/headers";
import type { User } from "@/lib/types";
import { DEMO_USERS, colorForId, initials } from "@/lib/users";
import { hasSupabaseAuth } from "@/lib/env";
import { getSupabaseAnon, getSupabaseAdmin } from "@/lib/supabase/server";

export const AUTH_COOKIE = "relay_user_id";
export const SUPABASE_ACCESS_COOKIE = "relay_sb_access";
export const SUPABASE_REFRESH_COOKIE = "relay_sb_refresh";

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();

  if (hasSupabaseAuth()) {
    const access = jar.get(SUPABASE_ACCESS_COOKIE)?.value;
    if (access) {
      const supabase = getSupabaseAnon();
      if (supabase) {
        const { data } = await supabase.auth.getUser(access);
        if (data.user) {
          const meta = data.user.user_metadata ?? {};
          const name =
            (meta.full_name as string) ||
            (meta.name as string) ||
            data.user.email?.split("@")[0] ||
            "User";
          return {
            id: data.user.id,
            name,
            email: data.user.email ?? `${data.user.id}@relay.local`,
            color: (meta.color as string) || colorForId(data.user.id),
            initials: (meta.initials as string) || initials(name),
          };
        }
      }
    }
  }

  const id = jar.get(AUTH_COOKIE)?.value;
  if (!id) return null;
  return DEMO_USERS.find((u) => u.id === id) ?? null;
}

export async function ensureProfile(user: User) {
  const admin = getSupabaseAdmin();
  if (!admin || !hasSupabaseAuth()) return;
  await admin.from("profiles").upsert({
    id: user.id,
    email: user.email,
    name: user.name,
    color: user.color,
    initials: user.initials,
  });
}

export function requireUserSync(userId: string | null | undefined): User {
  return DEMO_USERS.find((u) => u.id === userId) ?? DEMO_USERS[0];
}
