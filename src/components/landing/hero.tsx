"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixelBadge, PixelFrame } from "@/components/pixel/pixel-frame";

const LIVE_STEPS = [
  { kind: "plan", label: "Plan · 4 steps" },
  { kind: "tool", label: "Tool · web.search" },
  { kind: "steer", label: "Steer · focus on GTM" },
  { kind: "out", label: "Artifact synced" },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-ink" />
      <div className="absolute inset-0 grid-noise opacity-40" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-16 pt-6 md:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-primary-foreground">
            <span className="inline-flex size-8 items-center justify-center border-2 border-primary-foreground bg-foreground text-background shadow-pixel">
              <Radio className="size-4" />
            </span>
            <span className="font-pixel text-[11px] tracking-wide text-primary-foreground">
              RELAY
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="border-2 border-primary-foreground bg-primary-foreground text-foreground shadow-pixel hover:bg-primary-foreground/90"
            >
              <Link href="/login">Open workspace</Link>
            </Button>
          </div>
        </header>

        <div className="mt-16 flex flex-1 flex-col justify-center gap-12 lg:mt-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div className="max-w-xl text-primary-foreground">
            <PixelBadge className="mb-6 border-primary-foreground bg-transparent text-primary-foreground shadow-[3px_3px_0_0_oklch(0.95_0.004_260)]">
              <span className="size-1.5 animate-presence bg-primary-foreground" />
              Multiplayer AI
            </PixelBadge>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
              Relay
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-primary-foreground/75 md:text-xl">
              Shared rooms where your team and AI agents work the same
              long-running task — live, steerable, and remembered.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="border-2 border-primary-foreground bg-primary-foreground px-6 text-foreground shadow-pixel hover:translate-x-px hover:translate-y-px hover:shadow-none"
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
                className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
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
            <PixelFrame className="overflow-hidden bg-card/95 scanlines shadow-soft">
              <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 bg-foreground" />
                  <span className="font-mono text-xs uppercase tracking-wider">
                    room · strategy sprint
                  </span>
                </div>
                <div className="flex -space-x-2">
                  {["MC", "JH", "SO"].map((initials, i) => (
                    <span
                      key={initials}
                      className="flex size-7 items-center justify-center border-2 border-foreground bg-secondary font-pixel text-[8px]"
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
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.18, duration: 0.35 }}
                    className="flex items-center gap-3 border border-foreground/20 bg-muted/60 px-3 py-2"
                  >
                    <span className="font-pixel text-[8px] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-sm">{step.label}</span>
                    {index === LIVE_STEPS.length - 1 ? (
                      <span className="ml-auto size-2 animate-blink bg-foreground" />
                    ) : null}
                  </motion.div>
                ))}
              </div>
              <div className="border-t-2 border-foreground bg-secondary/70 px-4 py-3 font-mono text-xs text-muted-foreground">
                Handoff ready · artifact live · 3 watching
              </div>
            </PixelFrame>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
