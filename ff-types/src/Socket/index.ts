import { DecodedIdToken } from "firebase-admin/auth";
import { DraftPick, DraftState } from "../Draft";

export type ConnectionAction = {
  userId: string;
  userEmail: string;
  type: "connect" | "disconnect";
};

export type ServerToClientEvents = {
  "user connection": (action: ConnectionAction) => void;
  sync: (state: DraftState) => void;
};

export type ClientToServerEvents = {
  "join room": (room: string) => void;
  "leave room": (room: string) => void;
  draftPick: (pick: DraftPick, room: string) => void;
};

export type InterServerEvents = {};

export type SocketData = {
  user: DecodedIdToken;
};
