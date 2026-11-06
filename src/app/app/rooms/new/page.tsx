"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PixelFrame } from "@/components/pixel/pixel-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const PROMPTS = [
  {
    title: "Competitor research brief",
    prompt:
      "Research competitor positioning for multiplayer AI workspaces and draft a 1-page strategy brief. Focus on live steering, handoff, and shared history.",
  },
  {
    title: "API design plan",
    prompt:
      "Draft a code plan for a shared-room API with SSE progress, steer endpoints, and role-aware handoff. Include file layout and open questions.",
  },
  {
    title: "Founder GTM memo",
    prompt:
      "Write a short GTM memo for launching Relay to founding teams already using coding agents. Include beachhead, channels, and success metrics.",
  },
];

export default function NewRoomPage() {
  const router = useRouter();
  const [title, setTitle] = useState(PROMPTS[0].title);
  const [prompt, setPrompt] = useState(PROMPTS[0].prompt);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, prompt }),
      });
      const data = (await res.json()) as { room?: { id: string }; error?: string };
      if (!res.ok || !data.room) throw new Error(data.error ?? "Failed");
      router.push(`/app/rooms/${data.room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create room");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <p className="font-pixel text-[10px] uppercase text-muted-foreground">
        New room
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
        Start a shared agent session
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Teammates can join, watch live progress, steer, and take over.
      </p>

      <PixelFrame className="mt-8 bg-card p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Room title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-2 border-foreground shadow-pixel"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Agent prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="border-2 border-foreground font-mono text-sm shadow-pixel"
              required
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => {
                  setTitle(p.title);
                  setPrompt(p.prompt);
                }}
                className="border border-foreground/40 bg-secondary px-2 py-1 font-mono text-[11px] hover:border-foreground"
              >
                {p.title}
              </button>
            ))}
          </div>

          {error ? (
            <p className="font-mono text-sm text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            className="border-2 border-foreground shadow-pixel"
          >
            {submitting ? "Creating…" : "Create room"}
          </Button>
        </form>
      </PixelFrame>
    </main>
  );
}
