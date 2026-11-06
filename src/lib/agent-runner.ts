import { nanoid } from "nanoid";
import {
  appendEvent,
  getRoom,
  setArtifact,
  setStatus,
  updateRoom,
} from "@/lib/store";

const running = new Set<string>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPlan(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  if (lower.includes("code") || lower.includes("api") || lower.includes("implement")) {
    return [
      "Clarify requirements from the prompt",
      "Sketch architecture and file layout",
      "Draft implementation plan",
      "Call out risks and open questions",
      "Produce the shared code plan artifact",
    ];
  }
  if (lower.includes("research") || lower.includes("competitor") || lower.includes("strategy")) {
    return [
      "Frame the research question",
      "Survey relevant competitors and patterns",
      "Synthesize differentiation angles",
      "Draft recommendations for the team",
      "Publish the shared strategy brief",
    ];
  }
  return [
    "Understand the ask and success criteria",
    "Gather context and outline a plan",
    "Execute research / drafting steps",
    "Incorporate any mid-run steering",
    "Publish the shared artifact",
  ];
}

function toolForStep(step: string): { name: string; detail: string } {
  if (/survey|gather|research|competitor/i.test(step)) {
    return {
      name: "web.search",
      detail: "Querying public sources for multiplayer AI workspace patterns…",
    };
  }
  if (/architect|file|implement|code/i.test(step)) {
    return {
      name: "code.outline",
      detail: "Drafting module boundaries and interfaces…",
    };
  }
  if (/draft|publish|produce|recommend/i.test(step)) {
    return {
      name: "doc.write",
      detail: "Writing into the shared artifact…",
    };
  }
  return {
    name: "think.reason",
    detail: "Reasoning over room context and prior events…",
  };
}

function sectionForStep(step: string, prompt: string, steer?: string | null): string {
  const steerNote = steer
    ? `\n\n> Steering applied: ${steer}\n`
    : "";
  if (/frame|clarify|understand/i.test(step)) {
    return `## Objective\n${prompt.trim()}${steerNote}\n\nSuccess means a teammate can join mid-run, understand state, and continue without a private recap.\n`;
  }
  if (/survey|gather|competitor/i.test(step)) {
    return `## Landscape notes\n- Single-player agent chats trap context with one operator\n- Share links and comment threads are not live steering\n- Strong demand for presence, handoff, and searchable history${steerNote}\n`;
  }
  if (/architect|file|implement|code/i.test(step)) {
    return `## Proposed layout\n- \`/rooms/[id]\` — live session surface\n- timeline + artifact split view\n- SSE channel for progress & presence\n- steer / handoff actions with role checks${steerNote}\n`;
  }
  if (/differentiat|synthes|recommend/i.test(step)) {
    return `## Recommendations\n1. Lead with shared rooms for research/strategy before coding verticals\n2. Instrument handoffs and concurrent viewers as core KPIs\n3. Keep approvals human-first while agent reliability improves${steerNote}\n`;
  }
  if (/draft|publish|produce/i.test(step)) {
    return `## Shared output\nThis artifact is the team's source of truth for the session. Anyone with editor access can annotate, steer, or take ownership if the run needs a new direction.${steerNote}\n`;
  }
  return `## Progress\nCompleted: **${step}**${steerNote}\n`;
}

export async function runAgent(roomId: string): Promise<void> {
  if (running.has(roomId)) return;
  running.add(roomId);

  try {
    let room = await getRoom(roomId);
    if (!room) return;

    await setStatus(roomId, "running");
    const plan = room.plan.length ? room.plan : buildPlan(room.prompt);

    await updateRoom(roomId, (r) => ({
      ...r,
      plan,
      currentStepIndex: 0,
      status: "running",
    }));

    await appendEvent(roomId, {
      kind: "agent_plan",
      actorName: "Relay Agent",
      title: "Plan ready",
      body: plan.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    });

    let artifact = `# ${room.title}\n\n`;
    await setArtifact(roomId, artifact + "_Agent is working…_\n");

    for (let i = 0; i < plan.length; i++) {
      room = (await getRoom(roomId))!;
      if (!room || room.status === "paused") {
        await appendEvent(roomId, {
          kind: "status",
          actorName: "Relay Agent",
          title: "Paused",
          body: "Waiting for human direction.",
        });
        break;
      }

      const step = plan[i];
      await updateRoom(roomId, (r) => ({ ...r, currentStepIndex: i }));
      await appendEvent(roomId, {
        kind: "agent_step",
        actorName: "Relay Agent",
        title: `Step ${i + 1}/${plan.length}`,
        body: step,
      });

      await sleep(700);

      // Apply pending steer before tool call
      room = (await getRoom(roomId))!;
      const steer = room.pendingSteer;
      if (steer) {
        await appendEvent(roomId, {
          kind: "agent_output",
          actorName: "Relay Agent",
          title: "Acknowledged steering",
          body: `Adjusting remaining work toward: "${steer}"`,
        });
        await updateRoom(roomId, (r) => ({ ...r, pendingSteer: null }));
      }

      const tool = toolForStep(step);
      await appendEvent(roomId, {
        kind: "agent_tool",
        actorName: "Relay Agent",
        title: `Tool · ${tool.name}`,
        body: tool.detail,
        meta: { tool: tool.name },
      });

      await sleep(900);

      const section = sectionForStep(step, room.prompt, steer);
      artifact += section + "\n";
      await setArtifact(roomId, artifact);
      await appendEvent(roomId, {
        kind: "agent_output",
        actorName: "Relay Agent",
        title: "Artifact updated",
        body: step,
      });

      await sleep(500);
    }

    room = await getRoom(roomId);
    if (room && room.status === "running") {
      // Final polish section
      const finale = `## Session summary\n- Prompt: ${room.prompt}\n- Owner: ${room.currentOwnerName}\n- Steps completed: ${room.plan.length}\n- History retained for search and reuse\n`;
      await setArtifact(roomId, artifact + finale);
      await setStatus(roomId, "completed");
      await appendEvent(roomId, {
        kind: "status",
        actorName: "Relay Agent",
        title: "Session completed",
        body: "Shared artifact and full timeline are ready for the team.",
      });
      await updateRoom(roomId, (r) => ({
        ...r,
        currentStepIndex: r.plan.length,
      }));
    }
  } catch (error) {
    await setStatus(roomId, "failed");
    await appendEvent(roomId, {
      kind: "status",
      actorName: "Relay Agent",
      title: "Agent failed",
      body: error instanceof Error ? error.message : "Unknown error",
      id: `ev_${nanoid(6)}`,
    });
  } finally {
    running.delete(roomId);
  }
}

export function isAgentRunning(roomId: string) {
  return running.has(roomId);
}
