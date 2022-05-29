import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "@ff-mern/ff-types";
import { DecodedIdToken } from "firebase-admin/auth";
import { Server, Socket } from "socket.io";
import { auth } from "../../config/firebase-config.js";

type ServerType = Server<
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData
>;
type SocketType = Socket<
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData
>;

const connectedUsers: Record<string, DecodedIdToken> = {};

export class DraftSocket {
  io: ServerType;
  socket: SocketType;
  uid: string;

  constructor(socket: SocketType, io: ServerType, user: DecodedIdToken) {
    this.io = io;
    this.socket = socket;
    this.uid = user.uid;
    socket.on("disconnect", () => {
      console.log("user", connectedUsers[this.uid]?.email, "disconnected");
      delete connectedUsers[this.uid];
    });
  }
}

export const initSocket = (io: ServerType) => {
  io.on("connection", async (socket) => {
    const user = await auth.verifyIdToken(socket.handshake.auth.token);
    console.log("New client", user?.email, " connected");
    connectedUsers[user.uid] = user;
    new DraftSocket(socket, io, user);
  });
};
