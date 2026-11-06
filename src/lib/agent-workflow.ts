/**
 * Durable agent orchestration entrypoints.
 *
 * Today: fire-and-forget into `runAgent` (works on Vercel serverless for short runs).
 * Production: wrap with Inngest / Vercel Workflow so long runs survive restarts
 * and can be steered mid-flight via events.
 *
 * Example Inngest shape (enable when INNGEST_EVENT_KEY is set):
 *
 *   inngest.createFunction(
 *     { id: "relay-room-agent" },
 *     { event: "relay/agent.run" },
 *     async ({ event, step }) => {
 *       await step.run("agent", () => runAgent(event.data.roomId));
 *     },
 *   );
 */

import { isAgentRunning, runAgent } from "@/lib/agent-runner";

export async function enqueueAgentRun(roomId: string): Promise<{
  queued: boolean;
  alreadyRunning: boolean;
}> {
  if (isAgentRunning(roomId)) {
    return { queued: false, alreadyRunning: true };
  }

  // Inngest path when configured
  if (process.env.INNGEST_EVENT_KEY && process.env.INNGEST_EVENT_KEY.length > 0) {
    try {
      const res = await fetch("https://inn.gs/e/" + process.env.INNGEST_EVENT_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "relay/agent.run",
          data: { roomId },
        }),
      });
      if (res.ok) {
        return { queued: true, alreadyRunning: false };
      }
    } catch {
      /* fall through to inline */
    }
  }

  // Inline / serverless fallback
  void runAgent(roomId);
  return { queued: true, alreadyRunning: false };
}
