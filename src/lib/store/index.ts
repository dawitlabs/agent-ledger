import { hasSupabase } from "@/lib/env";
import * as memory from "@/lib/store/memory";
import * as supabaseStore from "@/lib/store/supabase-store";

function backend() {
  return hasSupabase() ? supabaseStore : memory;
}

export const listRooms = (...args: Parameters<typeof memory.listRooms>) =>
  backend().listRooms(...args);

export const getRoom = (...args: Parameters<typeof memory.getRoom>) =>
  backend().getRoom(...args);

export const createRoom = (...args: Parameters<typeof memory.createRoom>) =>
  backend().createRoom(...args);

export const updateRoom = (...args: Parameters<typeof memory.updateRoom>) =>
  backend().updateRoom(...args);

export const appendEvent = (...args: Parameters<typeof memory.appendEvent>) =>
  backend().appendEvent(...args);

export const setStatus = (...args: Parameters<typeof memory.setStatus>) =>
  backend().setStatus(...args);

export const setArtifact = (...args: Parameters<typeof memory.setArtifact>) =>
  backend().setArtifact(...args);

export const joinRoom = (...args: Parameters<typeof memory.joinRoom>) =>
  backend().joinRoom(...args);

export const addComment = (...args: Parameters<typeof memory.addComment>) =>
  backend().addComment(...args);

export const steerRoom = (...args: Parameters<typeof memory.steerRoom>) =>
  backend().steerRoom(...args);

export const handoffRoom = (...args: Parameters<typeof memory.handoffRoom>) =>
  backend().handoffRoom(...args);

export const subscribe = (...args: Parameters<typeof memory.subscribe>) =>
  backend().subscribe(...args);

export const touchPresence = (
  ...args: Parameters<typeof memory.touchPresence>
) => backend().touchPresence(...args);

export const getPresence = (...args: Parameters<typeof memory.getPresence>) =>
  backend().getPresence(...args);

export const findUser = (...args: Parameters<typeof memory.findUser>) =>
  backend().findUser(...args);
