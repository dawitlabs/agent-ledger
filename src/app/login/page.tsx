"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { PixelFrame } from "@/components/pixel/pixel-frame";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth")
      .then((r) => r.json())
      .then((data: { users: User[] }) => setUsers(data.users))
      .catch(() => setError("Could not load demo users."));
  }, []);

  async function signIn(userId: string) {
    setLoading(userId);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Sign-in failed");
      router.push("/app");
      router.refresh();
    } catch {
      setError("Sign-in failed. Try again.");
      setLoading(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 self-start">
        <span className="inline-flex size-8 items-center justify-center border-2 border-foreground bg-foreground text-background shadow-pixel">
          <Radio className="size-4" />
        </span>
        <span className="font-pixel text-[11px]">RELAY</span>
      </Link>

      <PixelFrame className="bg-card p-6 md:p-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Enter as a teammate
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Demo auth — pick a persona. Roles are enforced per room (owner,
          editor, viewer).
        </p>

        <div className="mt-6 space-y-3">
          {users.length === 0 && !error ? (
            <p className="font-mono text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              disabled={loading !== null}
              onClick={() => void signIn(user.id)}
              className="flex w-full items-center gap-3 border-2 border-foreground bg-background px-3 py-3 text-left shadow-pixel transition hover:-translate-y-px disabled:opacity-60"
            >
              <span
                className="flex size-10 items-center justify-center border-2 border-foreground font-pixel text-[10px] text-background"
                style={{ backgroundColor: user.color }}
              >
                {user.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-semibold">
                  {user.name}
                </span>
                <span className="block truncate font-mono text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {loading === user.id ? "…" : "Enter"}
              </span>
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-4 font-mono text-sm text-destructive">{error}</p>
        ) : null}

        <Button asChild variant="ghost" className="mt-6 w-full">
          <Link href="/">Back to landing</Link>
        </Button>
      </PixelFrame>
    </main>
  );
}
