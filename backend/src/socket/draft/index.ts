import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  DraftState,
  ProjectedPlayer,
  DraftPick,
  getCurrentPickInfo,
  ChatMessage,
} from "@ff-mern/ff-types";
import { DecodedIdToken } from "firebase-admin/auth";
import { Server, Socket } from "socket.io";
import { auth, db } from "../../config/firebase-config.js";
import { rebuildPlayersAndSelections } from "./utils.js";

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
const activeDrafts: Record<string, DraftState> = {};

export class DraftSocket {
  io: ServerType;
  socket: SocketType;
  uid: string;

  constructor(socket: SocketType, io: ServerType, user: DecodedIdToken) {
    this.io = io;
    this.socket = socket;
    this.uid = user.uid;
    socket.on("disconnect", () => this.onDisconnect());
    socket.on("join room", async (room) => this.onJoinRoom(room));
    socket.on("leave room", (room) => this.onLeaveRoom(room));
    socket.on("draftPick", (pick, room) => this.onDraftPick(pick, room));
    socket.on("sendMessage", (message, room) =>
      this.onChatMessage(message, room)
    );
  }

  syncToDb(roomId: string, draftPick?: DraftPick) {
    const draftState = activeDrafts[roomId];
    const draftRef = db.collection("drafts").doc(draftState.settings.draftId);
    if (draftPick) {
      draftRef
        .collection("selections")
        .doc(draftPick.pick.toString())
        .set(draftPick);
      draftRef
        .collection("availablePlayers")
        .doc(draftPick.player.fullName)
        .delete();
    }
    const { availablePlayers, selections, ...rest } = draftState;
    db.collection("drafts").doc(roomId).set(rest);
  }

  onDisconnect() {
    Object.entries(activeRooms).forEach(([room, users]) => {
      if (users[this.uid]) {
        this.onLeaveRoom(room);
      }
    });
    delete connectedUsers[this.uid];
  }

  async onJoinRoom(room: string) {
    this.socket.join(room);
    if (!activeRooms[room]) {
      activeRooms[room] = {};
    }
    let draftState = activeDrafts[room];
    if (!draftState) {
      try {
        const { draftState, availablePlayers, selections } =
          await rebuildPlayersAndSelections(room);
        draftState.availablePlayers = availablePlayers;
        draftState.selections = selections;
        activeDrafts[room] = { ...draftState, availablePlayers, selections };
      } catch (e) {
        console.error(e);
        return;
      }
    }
    activeRooms[room][this.uid] = {};
    console.info("user", connectedUsers[this.uid]?.email, "joined room", room);
    this.io.to(room).emit("user connection", {
      userId: this.uid,
      userEmail: connectedUsers[this.uid]?.email,
      type: "connect",
    });
    this.socket.emit("sync", activeDrafts[room]);
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

  onDraftPick(selection: DraftPick, room: string) {
    console.log("room", room, "received pick", selection);
    let draftState = activeDrafts[room];
    if (draftState) {
      const { round, pickInRound } = getCurrentPickInfo(draftState);
      draftState.selections[round][pickInRound] = selection;
      draftState.availablePlayers.splice(
        draftState.availablePlayers.findIndex(
          (p) => p.sanitizedName === selection.player.sanitizedName
        ),
        1
      );
      draftState.currentPick += 1;
      activeDrafts[room] = draftState;
      const pickMessage: ChatMessage = {
        sender: "system",
        message: `Pick ${selection.pick}: ${
          connectedUsers[this.uid]?.email
        } selects ${selection.player.fullName}, ${selection.player.position}, ${
          selection.player.team
        }`,
        timestamp: new Date().toISOString(),
        type: "draft",
      };
      this.io.to(room).emit("sync", draftState, pickMessage);
      this.syncToDb(room, selection);
    }
  }

  onChatMessage(message: string, room: string) {
    console.log("room", room, "received message", message);
    const newMessage: ChatMessage = {
      sender: connectedUsers[this.uid]?.email,
      message,
      timestamp: new Date().toISOString(),
      type: "chat",
    };
    this.io.to(room).emit("newMessage", newMessage);
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
    db.collection("drafts")
      .where("phase", "==", "live")
      .get()
      .then((liveDrafts) => {
        liveDrafts.forEach((doc) => {
          activeDrafts[doc.id] = doc.data() as DraftState;
        });
      });
    new DraftSocket(socket, io, socket.data.user);
  });
};
