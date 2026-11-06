import { cookies } from "next/headers";
import type { User } from "@/lib/types";
import { DEMO_USERS } from "@/lib/users";

export const AUTH_COOKIE = "relay_user_id";

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(AUTH_COOKIE)?.value;
  if (!id) return null;
  return DEMO_USERS.find((u) => u.id === id) ?? null;
}

export function requireUserSync(userId: string | null | undefined): User {
  const user = DEMO_USERS.find((u) => u.id === userId) ?? DEMO_USERS[0];
  return user;
}
