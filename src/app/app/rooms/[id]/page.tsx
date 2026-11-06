import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRoom } from "@/lib/store";
import { RoomView } from "@/components/room/room-view";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const room = await getRoom(id);
  if (!room) notFound();

  return <RoomView initialRoom={room} user={user} />;
}
