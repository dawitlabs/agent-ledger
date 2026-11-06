import { getCurrentUser } from "@/lib/auth";
import {
  getPresence,
  getRoom,
  subscribe,
  touchPresence,
} from "@/lib/store";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const room = await getRoom(id);
  if (!room) {
    return new Response("Not found", { status: 404 });
  }

  const user = await getCurrentUser();
  const encoder = new TextEncoder();

  let cleanup = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      send({ type: "hello", room, presence: await getPresence(id) });

      const unsubscribe = subscribe((roomId, payload) => {
        if (roomId === id) send(payload);
      });

      const heartbeat = setInterval(async () => {
        try {
          if (user) {
            const member = room.members.find((m) => m.userId === user.id);
            const presence = await touchPresence(
              id,
              user,
              member?.role ?? "viewer",
            );
            send({ type: "presence", presence });
          } else {
            send({ type: "ping", at: Date.now() });
          }
        } catch {
          /* client may have gone away */
        }
      }, 4000);

      if (user) {
        const member = room.members.find((m) => m.userId === user.id);
        await touchPresence(id, user, member?.role ?? "viewer");
      }

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
