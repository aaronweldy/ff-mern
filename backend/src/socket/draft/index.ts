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
  DraftPhase,
  RosteredPlayer,
  Position,
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
    socket.on("updateDraftPhase", (phase, room) =>
      this.onUpdateDraftPhase(phase, room)
    );
    socket.on("undoLastPick", (room) => this.onUndoPick(room));
    socket.on("autoPick", (room) => this.onAutoPick(room));
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
      if (draftPick.player) {
        draftRef
          .collection("availablePlayers")
          .doc(draftPick.player.fullName)
          .delete();
      }
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
    if (activeDrafts[room].league.commissioners.includes(this.uid)) {
      this.socket.emit("isCommissioner");
    }
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

  onDraftPick(selection: DraftPick, room: string, autoPick?: boolean) {
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
      const commissionerSelection = this.uid !== selection.selectedBy.owner;
      const pickMessage: ChatMessage = {
        sender: "system",
        message: `Pick ${selection.pick}: ${
          commissionerSelection ? "Commissioner" : ""
        } ${connectedUsers[this.uid]?.email} ${autoPick ? "auto" : ""}selects ${
          selection.player.fullName
        }, ${selection.player.position}, ${selection.player.team}`,
        timestamp: new Date().toISOString(),
        type: "draft",
      };
      this.syncToDb(room, selection);
      if (
        state.draftState.currentPick ===
        state.draftState.settings.draftOrder.length *
          state.draftState.settings.numRounds
      ) {
        this.onEndDraft(room, selection);
        return;
      }
      this.io.to(room).emit("sync", state.draftState, {
        message: pickMessage,
        draftPick: selection,
        playersByTeam: state.playersByTeam,
      });
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

  onUpdateDraftPhase(phase: DraftPhase, room: string) {
    console.log("room", room, "updated to phase", phase);
    activeDrafts[room].draftState.phase = phase;
    this.io.to(room).emit("sync", activeDrafts[room].draftState, {
      message: {
        sender: "system",
        message: `Draft phase updated to ${phase}`,
        timestamp: new Date().toISOString(),
        type: "draft",
      },
    });
  }

  onUndoPick(room: string) {
    console.log("room", room, "undid pick");
    const state = activeDrafts[room];
    if (!state || state.draftState.currentPick === 0) {
      console.error("Pick undone in non-saved state");
    }
    const { round, pickInRound } = getCurrentPickInfo(
      state.draftState,
      state.draftState.currentPick - 1
    );
    const lastSelection = state.draftState.selections[round][pickInRound];
    state.draftState.availablePlayers.push(lastSelection.player);
    lastSelection.player = null;
    state.draftState.currentPick -= 1;
    const undoMessage: ChatMessage = {
      sender: "system",
      message: `Commissioner ${
        connectedUsers[this.uid]?.email
      } undid Round ${round}, Pick ${pickInRound}`,
      timestamp: new Date().toISOString(),
      type: "draft",
    };
    this.io.to(room).emit("sync", state.draftState, {
      message: undoMessage,
      playersByTeam: buildPlayersByTeam(
        state.league.lineupSettings,
        state.draftState.settings.draftOrder,
        linearizeSelections(state.draftState.selections)
      ),
    });
    this.syncToDb(room, lastSelection);
  }

  onAutoPick(room: string) {
    const state = activeDrafts[room];
    if (!state) {
      console.error("Autopick in non-live draft");
    }
    const { round, pickInRound } = getCurrentPickInfo(state.draftState);
    const selection = state.draftState.selections[round][pickInRound];
    selection.player = state.draftState.availablePlayers[0];
    console.log("room", room, "autopicked", selection);
    this.onDraftPick(selection, room, true);
  }

  onEndDraft(room: string, lastPick: DraftPick) {
    console.log("room", room, "ended draft");
    const state = activeDrafts[room];
    if (!state) {
      console.error("End draft in non-live draft");
      return;
    }
    state.draftState.phase = "postdraft";
    const playersByTeam = buildPlayersByTeam(
      state.league.lineupSettings,
      state.draftState.settings.draftOrder,
      linearizeSelections(state.draftState.selections)
    );
    Object.entries(playersByTeam).forEach(([team, lineup]) => {
      let linearizedLineup: RosteredPlayer[] = [];
      for (const pos of Object.keys(lineup)) {
        for (const player of lineup[pos as Position]) {
          if (player.team !== "None") {
            const playerToAdd = JSON.parse(
              JSON.stringify(
                new RosteredPlayer(
                  player.fullName,
                  player.team,
                  player.position
                )
              )
            );
            linearizedLineup.push(playerToAdd);
          }
        }
      }
      db.collection("teams")
        .doc(team)
        .update({ rosteredPlayers: linearizedLineup });
    });
    this.io.to(room).emit("sync", state.draftState, {
      message: {
        sender: "system",
        message: `Draft complete!`,
        timestamp: new Date().toISOString(),
        type: "draft",
      },
      draftPick: lastPick,
    });
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
        const stateForDraft = await rebuildPlayersAndSelections(doc.id);
        const league = stateForDraft.league;
        activeDrafts[doc.id] = {
          league,
          draftState: {
            ...stateForDraft.draftState,
            availablePlayers: stateForDraft.availablePlayers,
            selections: stateForDraft.selections,
          },
          chatMessages: [],
          playersByTeam: buildPlayersByTeam(
            league.lineupSettings,
            draftData.settings.draftOrder,
            linearizeSelections(stateForDraft.selections)
          ),
        };
      });
    });
  io.on("connection", (socket) => {
    connectedUsers[socket.data.user.uid] = socket.data.user;
    new DraftSocket(socket, io, socket.data.user);
  });
};
