"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixelFrame } from "@/components/pixel/pixel-frame";
import { PixelCloudBg } from "@/components/landing/pixel-cloud-bg";

const LIVE_STEPS = [
  { kind: "plan", label: "Plan · 4 steps" },
  { kind: "tool", label: "Tool · web.search" },
  { kind: "steer", label: "Steer · focus on GTM" },
  { kind: "out", label: "Artifact synced" },
];

export function LandingHero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#050608]">
      {/* Soft base wash (one-color) + procedural pixel clouds on top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[70svh] min-h-[420px]"
        style={{
          background:
            "linear-gradient(180deg, #1a1e28 0%, #0c0e14 55%, #050608 100%)",
          maskImage:
            "linear-gradient(to bottom, black 70%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 70%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[66svh] min-h-[400px]"
      >
        <PixelCloudBg
          className="absolute inset-0 opacity-95"
          intensity={1.45}
          seed={2}
          tint={[120, 128, 148]}
          direction="down"
        />
        <PixelCloudBg
          className="absolute inset-0 opacity-55"
          intensity={0.9}
          seed={7}
          tint={[96, 104, 120]}
          direction="down"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-36 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-16 pt-6 md:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-white [text-shadow:0_0_18px_rgb(20_24_36/0.55)]"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-md border border-white/25 bg-white/10 backdrop-blur-sm">
              <Radio className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-[0.14em] uppercase">
              Relay
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="text-white/85 hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="rounded-lg bg-white text-foreground shadow-[0_14px_30px_-14px_rgb(0_0_0/0.65)] hover:bg-white/90"
            >
              <Link href="/login">Open workspace</Link>
            </Button>
          </div>
        </header>

        <div className="mt-16 flex flex-1 flex-col justify-center gap-12 lg:mt-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div className="max-w-xl text-white">
            <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/25 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.16em] uppercase text-white/85 backdrop-blur-sm">
              <span className="size-1.5 animate-presence bg-white" />
              Multiplayer AI
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl [text-shadow:0_0_40px_rgb(20_24_36/0.45)]">
              Relay
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75 md:text-xl">
              Shared rooms where your team and AI agents work the same
              long-running task — live, steerable, and remembered.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-lg bg-white px-6 text-foreground shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)] hover:bg-white/90"
              >
                <Link href="/login">
                  Start a room
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-white/85 hover:bg-white/10 hover:text-white"
              >
                <Link href="#how">See how it works</Link>
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <PixelFrame className="overflow-hidden border-white/20 bg-card/90 shadow-soft backdrop-blur-sm scanlines">
              <div className="flex items-center justify-between border-b border-foreground/15 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm bg-foreground" />
                  <span className="font-mono text-xs uppercase tracking-wider">
                    room · strategy sprint
                  </span>
                </div>
                <div className="flex -space-x-2">
                  {["MC", "JH", "SO"].map((initials, i) => (
                    <span
                      key={initials}
                      className="flex size-7 items-center justify-center rounded-md border border-foreground/20 bg-secondary font-mono text-[10px] font-semibold"
                      style={{ zIndex: 3 - i }}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2 p-4">
                {LIVE_STEPS.map((step, index) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.18, duration: 0.35 }}
                    className="flex items-center gap-3 rounded-md border border-foreground/10 bg-muted/50 px-3 py-2"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-sm">{step.label}</span>
                    {index === LIVE_STEPS.length - 1 ? (
                      <span className="ml-auto size-2 animate-blink rounded-sm bg-foreground" />
                    ) : null}
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-foreground/15 bg-secondary/50 px-4 py-3 font-mono text-xs text-muted-foreground">
                Handoff ready · artifact live · 3 watching
              </div>
            </PixelFrame>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
