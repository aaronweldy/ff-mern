import { DecodedIdToken } from "firebase-admin/auth";
import { ChatMessage } from "../Chat";
import { DraftPick, DraftState } from "../Draft";

export type ConnectionAction = {
  userId: string;
  userEmail: string;
  type: "connect" | "disconnect";
};

export type ServerToClientEvents = {
  "user connection": (action: ConnectionAction) => void;
  sync: (state: DraftState, message?: ChatMessage) => void;
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
