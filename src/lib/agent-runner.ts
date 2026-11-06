import { nanoid } from "nanoid";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  appendEvent,
  getRoom,
  setArtifact,
  setStatus,
  updateRoom,
} from "@/lib/store";
import { hasOpenAI } from "@/lib/env";

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
  if (
    lower.includes("research") ||
    lower.includes("competitor") ||
    lower.includes("strategy")
  ) {
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

function sectionForStep(
  step: string,
  prompt: string,
  steer?: string | null,
): string {
  const steerNote = steer ? `\n\n> Steering applied: ${steer}\n` : "";
  if (/frame|clarify|understand/i.test(step)) {
    return `## Objective\n${prompt.trim()}${steerNote}\n\nSuccess means a teammate can join mid-run, understand state, and continue without a private recap.\n`;
  }
  if (/survey|gather|competitor/i.test(step)) {
    return `## Landscape notes\n- Single-player agent chats trap context with one operator\n- Share links and comment threads are not live steering\n- Strong demand for presence, handoff, and searchable history${steerNote}\n`;
  }
  if (/architect|file|implement|code/i.test(step)) {
    return `## Proposed layout\n- \`/rooms/[id]\` — live session surface\n- timeline + artifact split view\n- SSE / Realtime channel for progress & presence\n- steer / handoff actions with role checks${steerNote}\n`;
  }
  if (/differentiat|synthes|recommend/i.test(step)) {
    return `## Recommendations\n1. Lead with shared rooms for research/strategy before coding verticals\n2. Instrument handoffs and concurrent viewers as core KPIs\n3. Keep approvals human-first while agent reliability improves${steerNote}\n`;
  }
  if (/draft|publish|produce/i.test(step)) {
    return `## Shared output\nThis artifact is the team's source of truth for the session. Anyone with editor access can annotate, steer, or take ownership if the run needs a new direction.${steerNote}\n`;
  }
  return `## Progress\nCompleted: **${step}**${steerNote}\n`;
}

async function runDemoAgent(roomId: string): Promise<void> {
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

    const toolCall = toolForStep(step);
    await appendEvent(roomId, {
      kind: "agent_tool",
      actorName: "Relay Agent",
      title: `Tool · ${toolCall.name}`,
      body: toolCall.detail,
      meta: { tool: toolCall.name },
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
}

async function runOpenAIAgent(roomId: string): Promise<void> {
  const room = await getRoom(roomId);
  if (!room) return;

  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    await runDemoAgent(roomId);
    return;
  }

  const openai = createOpenAI({ apiKey });
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
    title: "Plan ready (AI SDK)",
    body: plan.map((s, i) => `${i + 1}. ${s}`).join("\n"),
  });

  let artifact = `# ${room.title}\n\n`;
  await setArtifact(roomId, `${artifact}_Agent is drafting with OpenAI…_\n`);

  const latest = await getRoom(roomId);
  const steer = latest?.pendingSteer;

  await appendEvent(roomId, {
    kind: "agent_tool",
    actorName: "Relay Agent",
    title: "Tool · llm.generate",
    body: "Streaming a structured brief via Vercel AI SDK…",
    meta: { tool: "llm.generate" },
  });

  for (let i = 0; i < plan.length; i++) {
    await updateRoom(roomId, (r) => ({ ...r, currentStepIndex: i }));
    await appendEvent(roomId, {
      kind: "agent_step",
      actorName: "Relay Agent",
      title: `Step ${i + 1}/${plan.length}`,
      body: plan[i],
    });
  }

  const result = await generateText({
    model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
    system: `You are Relay Agent inside a multiplayer team room.
Write a clear markdown artifact for the shared document.
Honor any mid-run steering. Be concrete and concise.
Do not wrap the whole answer in a code fence.`,
    prompt: `Room title: ${room.title}
Team prompt: ${room.prompt}
${steer ? `Steering from the team: ${steer}` : ""}
Plan steps:
${plan.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Produce the full shared artifact markdown now.`,
  });

  if (steer) {
    await appendEvent(roomId, {
      kind: "agent_output",
      actorName: "Relay Agent",
      title: "Acknowledged steering",
      body: `Adjusted the draft toward: "${steer}"`,
    });
    await updateRoom(roomId, (r) => ({ ...r, pendingSteer: null }));
  }

  artifact = result.text.startsWith("#")
    ? result.text
    : `# ${room.title}\n\n${result.text}`;
  await setArtifact(roomId, artifact);
  await appendEvent(roomId, {
    kind: "agent_output",
    actorName: "Relay Agent",
    title: "Artifact updated",
    body: "OpenAI generation complete",
  });
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

/**
 * Entry point for room agent runs.
 * Uses OpenAI via Vercel AI SDK when OPENAI_API_KEY is set; otherwise demo runner.
 * Durable orchestration can wrap this via Inngest (`src/lib/agent-workflow.ts`).
 */
export async function runAgent(roomId: string): Promise<void> {
  if (running.has(roomId)) return;
  running.add(roomId);

  try {
    if (hasOpenAI()) {
      await runOpenAIAgent(roomId);
    } else {
      await runDemoAgent(roomId);
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
