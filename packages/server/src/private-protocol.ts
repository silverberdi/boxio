import type { PrivateRoomSnapshot, RoomCommand } from "./private-room.js";

export type PrivateMessage =
  | Readonly<{ type: "join"; protocolVersion: 1; name: string }>
  | Readonly<{ type: "reconnect"; protocolVersion: 1; participantId: string; credential: string }>
  | Readonly<{ type: "snapshot"; protocolVersion: 1; snapshot: PrivateRoomSnapshot }>
  | Readonly<{ type: "command"; protocolVersion: 1; command: RoomCommand }>
  | Readonly<{ type: "ack"; protocolVersion: 1; commandId: string; eventSequence: number; snapshot: PrivateRoomSnapshot }>
  | Readonly<{ type: "reject"; protocolVersion: 1; commandId?: string; code: string; snapshot: PrivateRoomSnapshot }>;

export function serializeMessage(message: PrivateMessage): string {
  return JSON.stringify({ ...message, protocolVersion: 1 });
}

export function parseMessage(raw: string): PrivateMessage {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || (value as { protocolVersion?: unknown }).protocolVersion !== 1 || typeof (value as { type?: unknown }).type !== "string") throw new Error("Unsupported protocol message");
  return value as PrivateMessage;
}

export function snapshotMessage(snapshot: PrivateRoomSnapshot): PrivateMessage {
  return { type: "snapshot", protocolVersion: 1, snapshot };
}
