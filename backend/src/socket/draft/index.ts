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
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type SocketType = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type UserRoomData = {};
const connectedUsers: Record<string, DecodedIdToken> = {};
const activeRooms: Record<string, Record<string, UserRoomData>> = {};

export class DraftSocket {
  io: ServerType;
  socket: SocketType;
  uid: string;

  constructor(socket: SocketType, io: ServerType, user: DecodedIdToken) {
    this.io = io;
    this.socket = socket;
    this.uid = user.uid;
    socket.on("disconnect", () => this.onDisconnect());
    socket.on("join room", (room) => this.onJoinRoom(room));
    socket.on("leave room", (room) => this.onLeaveRoom(room));
  }

  onDisconnect() {
    Object.entries(activeRooms).forEach(([room, users]) => {
      if (users[this.uid]) {
        this.onLeaveRoom(room);
      }
    });
    delete connectedUsers[this.uid];
  }

  onJoinRoom(room: string) {
    this.socket.join(room);
    if (!activeRooms[room]) {
      activeRooms[room] = {};
    }
    activeRooms[room][this.uid] = {};
    console.info("user", connectedUsers[this.uid]?.email, "joined room", room);
    this.io.to(room).emit("user connection", {
      userId: this.uid,
      userEmail: connectedUsers[this.uid]?.email,
      type: "connect",
    });
  }

  onLeaveRoom(room: string) {
    this.socket.leave(room);
    delete activeRooms[room][this.uid];
    console.info("user", connectedUsers[this.uid]?.email, "left room", room);
    this.io.to(room).emit("user connection", {
      userId: this.uid,
      userEmail: connectedUsers[this.uid]?.email,
      type: "disconnect",
    });
  }
}

export const initSocket = (io: ServerType) => {
  io.use((socket: SocketType, next: Function) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    auth
      .verifyIdToken(token)
      .then((decodedIdToken: DecodedIdToken) => {
        connectedUsers[decodedIdToken.uid] = decodedIdToken;
        socket.data.user = decodedIdToken;
        next();
      })
      .catch((error: Error) => {
        next(error);
      });
  });
  io.on("connection", (socket) => {
    connectedUsers[socket.data.user.uid] = socket.data.user;
    new DraftSocket(socket, io, socket.data.user);
  });
};
