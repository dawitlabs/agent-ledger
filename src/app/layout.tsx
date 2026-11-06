import type { Metadata } from "next";
import { IBM_Plex_Mono, Press_Start_2P, Syne } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const syne = Syne({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const pressStart = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Relay — Multiplayer AI Workspace",
  description:
    "Shared rooms where humans and AI agents work long-running tasks together: live progress, mid-run steering, handoff, and searchable team history.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${plexMono.variable} ${pressStart.variable} h-full`}
      style={
        {
          ["--font-display" as string]: "var(--font-sans)",
        } as React.CSSProperties
      }
    >
      <body className="flex min-h-full flex-col font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
