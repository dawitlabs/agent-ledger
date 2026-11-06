"use client";

import { motion } from "motion/react";
import {
  Eye,
  Handshake,
  History,
  RadioTower,
  Sparkles,
  Users,
} from "lucide-react";
import { PixelFrame } from "@/components/pixel/pixel-frame";

const FEATURES = [
  {
    icon: Users,
    title: "Shared rooms",
    body: "Start an agent task once. Invite the team. Everyone lands in the same live session.",
  },
  {
    icon: RadioTower,
    title: "Live agent progress",
    body: "Watch the plan, steps, tool calls, and partial outputs stream in with presence indicators.",
  },
  {
    icon: Sparkles,
    title: "Steer mid-run",
    body: "Inject direction without restarting. Redirect focus, approve pauses, keep momentum.",
  },
  {
    icon: Handshake,
    title: "Clean handoff",
    body: "Pass ownership when context shifts. The next person picks up the full trail, not a summary.",
  },
  {
    icon: History,
    title: "Shared history",
    body: "Human + agent actions stay searchable. Sessions become organizational memory.",
  },
  {
    icon: Eye,
    title: "Live artifact",
    body: "One primary document updates as the agent works — research brief, design doc, or code plan.",
  },
];

export function LandingSections() {
  return (
    <>
      <section id="how" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <p className="font-pixel text-[10px] uppercase text-muted-foreground">
            Why Relay
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-5xl">
            AI work shouldn&apos;t be trapped in one chat.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Google Docs made writing multiplayer. Figma made design multiplayer.
            Relay does the same for long-running agents — so teammates can watch,
            steer, and take over without starting over.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <PixelFrame className="h-full bg-card/80 p-5 transition-transform hover:-translate-y-0.5">
                <feature.icon className="size-5" strokeWidth={1.75} />
                <h3 className="mt-4 font-display text-xl font-bold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </PixelFrame>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y-2 border-foreground bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:px-8 md:py-20">
          <div>
            <p className="font-pixel text-[10px] uppercase opacity-70">
              Flow
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
              Create. Watch. Steer. Hand off.
            </h2>
          </div>
          <ol className="space-y-5 font-mono text-sm">
            {[
              "Create a room, invite teammates, paste a prompt or starting artifact.",
              "Everyone sees live progress — plan, tools, and the shared document.",
              "Anyone with permission injects steering or takes ownership mid-task.",
              "Finish with a full audit trail your next session can reuse.",
            ].map((item, i) => (
              <li key={item} className="flex gap-4">
                <span className="font-pixel text-[10px] opacity-60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed opacity-90">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <PixelFrame className="overflow-hidden bg-card">
          <div className="grid md:grid-cols-[1.2fr_0.8fr]">
            <div className="p-8 md:p-12">
              <p className="font-pixel text-[10px] uppercase text-muted-foreground">
                Built for
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Founding teams already living in agents.
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Start with shared research and strategy sessions for product,
                eng, and founder teams of 5–30 — then expand to coding rooms and
                other knowledge work.
              </p>
            </div>
            <div className="border-t-2 border-foreground bg-secondary/50 p-8 md:border-l-2 md:border-t-0 md:p-12">
              <ul className="space-y-4 font-mono text-sm">
                <li>Owner · Editor · Viewer roles</li>
                <li>Presence for who&apos;s watching</li>
                <li>Searchable activity timeline</li>
                <li>Demo agent runner (swap in AI SDK)</li>
              </ul>
            </div>
          </div>
        </PixelFrame>
      </section>

      <footer className="border-t-2 border-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[10px]">RELAY</span>
            <span className="text-sm text-muted-foreground">
              Multiplayer AI Workspace
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            MVP · rooms · live progress · steer · handoff · history
          </p>
        </div>
      </footer>
    </>
  );
}
