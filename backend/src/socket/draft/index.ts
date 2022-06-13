import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  DraftState,
  DraftPick,
  getCurrentPickInfo,
  ChatMessage,
  League,
  TeamRoster,
} from "@ff-mern/ff-types";
import { DecodedIdToken } from "firebase-admin/auth";
import { Server, Socket } from "socket.io";
import { auth, db } from "../../config/firebase-config.js";
import {
  addPlayerToTeam,
  buildPlayersByTeam,
  linearizeSelections,
  rebuildPlayersAndSelections,
} from "./utils.js";

type ServerState = {
  league: League;
  draftState: DraftState;
  chatMessages: ChatMessage[];
  playersByTeam: Record<string, TeamRoster>;
};

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
const activeDrafts: Record<string, ServerState> = {};

export class DraftSocket {
  io: ServerType;
  socket: SocketType;
  uid: string;
  league: League;

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
    const state = activeDrafts[roomId];
    const draftRef = db
      .collection("drafts")
      .doc(state.draftState.settings.draftId);
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
    const { availablePlayers, selections, ...rest } = state.draftState;
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
    let state = activeDrafts[room];
    if (!state) {
      try {
        const { draftState, availablePlayers, selections, league } =
          await rebuildPlayersAndSelections(room);
        draftState.availablePlayers = availablePlayers;
        draftState.selections = selections;
        activeDrafts[room] = {
          league,
          chatMessages: [],
          playersByTeam: buildPlayersByTeam(
            league.lineupSettings,
            draftState.settings.draftOrder,
            linearizeSelections(draftState.selections)
          ),
          draftState: { ...draftState, availablePlayers, selections },
        };
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
    this.socket.emit("sync", activeDrafts[room].draftState, {
      playersByTeam: activeDrafts[room].playersByTeam,
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

  onDraftPick(selection: DraftPick, room: string) {
    console.log("room", room, "received pick", selection);
    let state = activeDrafts[room];
    if (state) {
      const { round, pickInRound } = getCurrentPickInfo(state.draftState);
      state.draftState.selections[round][pickInRound] = selection;
      state.draftState.availablePlayers.splice(
        state.draftState.availablePlayers.findIndex(
          (p) => p.sanitizedName === selection.player.sanitizedName
        ),
        1
      );
      addPlayerToTeam(state.playersByTeam, selection);
      state.draftState.currentPick += 1;
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
      this.io.to(room).emit("sync", state.draftState, {
        message: pickMessage,
        draftPick: selection,
        playersByTeam: state.playersByTeam,
      });
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

export const initSocket = async (io: ServerType) => {
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
  db.collection("drafts")
    .where("phase", "==", "live")
    .get()
    .then((liveDrafts) => {
      liveDrafts.forEach(async (doc) => {
        const draftData = doc.data() as DraftState;
        const leagueForDraft = (
          await db.collection("leagues").doc(draftData.leagueId).get()
        ).data() as League;
        activeDrafts[doc.id] = {
          league: leagueForDraft,
          draftState: draftData as DraftState,
          chatMessages: [],
          playersByTeam: buildPlayersByTeam(
            leagueForDraft.lineupSettings,
            draftData.settings.draftOrder,
            linearizeSelections(draftData.selections)
          ),
        };
      });
    });
  io.on("connection", (socket) => {
    connectedUsers[socket.data.user.uid] = socket.data.user;
    new DraftSocket(socket, io, socket.data.user);
  });
};
