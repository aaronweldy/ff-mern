import { DecodedIdToken } from "firebase-admin/auth";
import { ChatMessage } from "../Chat";
import { DraftPick, DraftState } from "../Draft";
import { TeamRoster } from "../Team";

export type ConnectionAction = {
  userId: string;
  userEmail: string;
  type: "connect" | "disconnect";
};

export type SyncAction = {
  message: ChatMessage;
  playersByTeam: Record<string, TeamRoster>;
  draftPick: DraftPick;
};

export type ServerToClientEvents = {
  "user connection": (action: ConnectionAction) => void;
  sync: (state: DraftState, action: Partial<SyncAction>) => void;
  newMessage: (message: ChatMessage) => void;
};

export type ClientToServerEvents = {
  "join room": (room: string) => void;
  "leave room": (room: string) => void;
  draftPick: (pick: DraftPick, room: string) => void;
  sendMessage: (message: string, room: string) => void;
};

export type InterServerEvents = {};

export type SocketData = {
  user: DecodedIdToken;
};
