"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { PixelFrame } from "@/components/pixel/pixel-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/lib/types";

type AuthMode = "demo" | "supabase";

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [authMode, setAuthMode] = useState<AuthMode>("demo");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [formMode, setFormMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth")
      .then((r) => r.json())
      .then(
        (data: {
          users: User[];
          authMode?: AuthMode;
        }) => {
          setUsers(data.users);
          setAuthMode(data.authMode === "supabase" ? "supabase" : "demo");
        },
      )
      .catch(() => setError("Could not load auth."));
  }, []);

  async function signInDemo(userId: string) {
    setLoading(userId);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mode: "demo" }),
      });
      if (!res.ok) throw new Error("Sign-in failed");
      router.push("/app");
      router.refresh();
    } catch {
      setError("Sign-in failed. Try again.");
      setLoading(null);
    }
  }

  async function submitSupabase(e: React.FormEvent) {
    e.preventDefault();
    setLoading("supabase");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: formMode,
          email,
          password,
          name,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        needsConfirmation?: boolean;
        message?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Auth failed");
      if (data.needsConfirmation) {
        setMessage(data.message ?? "Confirm your email to continue.");
        setLoading(null);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
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
          {authMode === "supabase" ? "Sign in to Relay" : "Enter as a teammate"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {authMode === "supabase"
            ? "Supabase Auth is enabled. Use email/password, or pick a demo persona for local testing."
            : "Demo auth — pick a persona. Roles are enforced per room (owner, editor, viewer)."}
        </p>

        {authMode === "supabase" ? (
          <form onSubmit={submitSupabase} className="mt-6 space-y-4">
            {formMode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-2 border-foreground shadow-pixel"
                  required
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-foreground shadow-pixel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-2 border-foreground shadow-pixel"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              disabled={loading === "supabase"}
              className="w-full border-2 border-foreground shadow-pixel"
            >
              {loading === "supabase"
                ? "…"
                : formMode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
            <button
              type="button"
              className="w-full font-mono text-xs text-muted-foreground underline"
              onClick={() =>
                setFormMode((m) => (m === "signin" ? "signup" : "signin"))
              }
            >
              {formMode === "signin"
                ? "Need an account? Sign up"
                : "Have an account? Sign in"}
            </button>
          </form>
        ) : null}

        <div className={authMode === "supabase" ? "mt-8 space-y-3" : "mt-6 space-y-3"}>
          {authMode === "supabase" ? (
            <p className="font-pixel text-[9px] uppercase text-muted-foreground">
              Demo personas
            </p>
          ) : null}
          {users.length === 0 && !error ? (
            <p className="font-mono text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              disabled={loading !== null}
              onClick={() => void signInDemo(user.id)}
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

        {message ? (
          <p className="mt-4 font-mono text-sm text-muted-foreground">{message}</p>
        ) : null}
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
