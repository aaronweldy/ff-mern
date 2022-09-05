var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { getCurrentPickInfo, RosteredPlayer, } from "@ff-mern/ff-types";
import { auth, db } from "../../config/firebase-config.js";
import { addPlayerToTeam, buildPlayersByTeam, linearizeSelections, rebuildPlayersAndSelections, } from "./utils.js";
const connectedUsers = {};
const activeRooms = {};
export const activeDrafts = {};
export class DraftSocket {
    constructor(socket, io, user) {
        this.io = io;
        this.socket = socket;
        this.uid = user.uid;
        socket.on("disconnect", () => this.onDisconnect());
        socket.on("join room", (room) => __awaiter(this, void 0, void 0, function* () { return this.onJoinRoom(room); }));
        socket.on("leave room", (room) => this.onLeaveRoom(room));
        socket.on("draftPick", (pick, room) => this.onDraftPick(pick, room));
        socket.on("sendMessage", (message, room) => this.onChatMessage(message, room));
        socket.on("updateDraftPhase", (phase, room) => this.onUpdateDraftPhase(phase, room));
        socket.on("undoLastPick", (room) => this.onUndoPick(room));
        socket.on("autoPick", (room) => this.onAutoPick(room));
    }
    syncToDb(roomId, draftPick) {
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
        const _a = state.draftState, { availablePlayers, selections } = _a, rest = __rest(_a, ["availablePlayers", "selections"]);
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
    onJoinRoom(room) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.socket.join(room);
            if (!activeRooms[room]) {
                activeRooms[room] = {};
            }
            let state = activeDrafts[room];
            if (!state) {
                try {
                    const { draftState, availablePlayers, selections, league } = yield rebuildPlayersAndSelections(room);
                    draftState.availablePlayers = availablePlayers;
                    draftState.selections = selections;
                    activeDrafts[room] = {
                        league,
                        chatMessages: [],
                        playersByTeam: buildPlayersByTeam(league.lineupSettings, draftState.settings.draftOrder, linearizeSelections(draftState.selections)),
                        draftState: Object.assign(Object.assign({}, draftState), { availablePlayers, selections }),
                    };
                }
                catch (e) {
                    console.error(e);
                    return;
                }
            }
            activeRooms[room][this.uid] = {};
            console.info("user", (_a = connectedUsers[this.uid]) === null || _a === void 0 ? void 0 : _a.email, "joined room", room);
            this.socket.emit("sync", activeDrafts[room].draftState, {
                playersByTeam: activeDrafts[room].playersByTeam,
            });
            if (activeDrafts[room].league.commissioners.includes(this.uid)) {
                this.socket.emit("isCommissioner");
            }
        });
    }
    onLeaveRoom(room) {
        var _a;
        this.socket.leave(room);
        delete activeRooms[room][this.uid];
        console.info("user", (_a = connectedUsers[this.uid]) === null || _a === void 0 ? void 0 : _a.email, "left room", room);
    }
    onDraftPick(selection, room, autoPick) {
        var _a;
        console.log("room", room, "received pick", selection);
        let state = activeDrafts[room];
        if (state) {
            const { round, pickInRound } = getCurrentPickInfo(state.draftState);
            state.draftState.selections[round][pickInRound] = selection;
            state.draftState.availablePlayers.splice(state.draftState.availablePlayers.findIndex((p) => p.sanitizedName === selection.player.sanitizedName), 1);
            addPlayerToTeam(state.playersByTeam, selection);
            state.draftState.currentPick += 1;
            const commissionerSelection = this.uid !== selection.selectedBy.owner;
            const pickMessage = {
                sender: "system",
                message: `Pick ${selection.pick}: ${commissionerSelection ? "Commissioner" : ""} ${(_a = connectedUsers[this.uid]) === null || _a === void 0 ? void 0 : _a.email} ${autoPick ? "auto" : ""}selects ${selection.player.fullName}, ${selection.player.position}, ${selection.player.team}`,
                timestamp: new Date().toISOString(),
                type: "draft",
            };
            if (state.draftState.currentPick ===
                state.draftState.settings.draftOrder.length *
                    state.draftState.settings.numRounds) {
                this.onEndDraft(room, selection);
                return;
            }
            this.syncToDb(room, selection);
            this.io.to(room).emit("sync", state.draftState, {
                message: pickMessage,
                draftPick: selection,
                playersByTeam: state.playersByTeam,
            });
        }
    }
    onChatMessage(message, room) {
        var _a;
        console.log("room", room, "received message", message);
        const newMessage = {
            sender: (_a = connectedUsers[this.uid]) === null || _a === void 0 ? void 0 : _a.email,
            message,
            timestamp: new Date().toISOString(),
            type: "chat",
        };
        this.io.to(room).emit("newMessage", newMessage);
    }
    onUpdateDraftPhase(phase, room) {
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
    onUndoPick(room) {
        var _a;
        console.log("room", room, "undid pick");
        const state = activeDrafts[room];
        if (!state || state.draftState.currentPick === 0) {
            console.error("Pick undone in non-saved state");
            return;
        }
        const { round, pickInRound } = getCurrentPickInfo(state.draftState, state.draftState.currentPick - 1);
        const lastSelection = state.draftState.selections[round][pickInRound];
        state.draftState.availablePlayers.push(lastSelection.player);
        lastSelection.player = null;
        state.draftState.currentPick -= 1;
        const undoMessage = {
            sender: "system",
            message: `Commissioner ${(_a = connectedUsers[this.uid]) === null || _a === void 0 ? void 0 : _a.email} undid Round ${round}, Pick ${pickInRound}`,
            timestamp: new Date().toISOString(),
            type: "draft",
        };
        this.io.to(room).emit("sync", state.draftState, {
            message: undoMessage,
            playersByTeam: buildPlayersByTeam(state.league.lineupSettings, state.draftState.settings.draftOrder, linearizeSelections(state.draftState.selections)),
        });
        this.syncToDb(room, lastSelection);
    }
    onAutoPick(room) {
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
    onEndDraft(room, lastPick) {
        console.log("room", room, "ended draft");
        const state = activeDrafts[room];
        if (!state) {
            console.error("End draft in non-live draft");
            return;
        }
        state.draftState.phase = "postdraft";
        const playersByTeam = buildPlayersByTeam(state.league.lineupSettings, state.draftState.settings.draftOrder, linearizeSelections(state.draftState.selections));
        Object.entries(playersByTeam).forEach(([team, lineup]) => {
            let linearizedLineup = [];
            for (const pos of Object.keys(lineup)) {
                for (const player of lineup[pos]) {
                    if (player.team !== "None") {
                        const playerToAdd = JSON.parse(JSON.stringify(new RosteredPlayer(player.fullName, player.team, player.position)));
                        linearizedLineup.push(playerToAdd);
                    }
                }
            }
            db.collection("teams")
                .doc(team)
                .update({ rosteredPlayers: linearizedLineup });
        });
        this.syncToDb(room, lastPick);
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
export const initSocket = (io) => __awaiter(void 0, void 0, void 0, function* () {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        auth
            .verifyIdToken(token)
            .then((decodedIdToken) => {
            connectedUsers[decodedIdToken.uid] = decodedIdToken;
            socket.data.user = decodedIdToken;
            next();
        })
            .catch((error) => {
            next(error);
        });
    });
    db.collection("drafts")
        .where("phase", "==", "live")
        .get()
        .then((liveDrafts) => {
        liveDrafts.forEach((doc) => __awaiter(void 0, void 0, void 0, function* () {
            const draftData = doc.data();
            const stateForDraft = yield rebuildPlayersAndSelections(doc.id);
            const league = stateForDraft.league;
            activeDrafts[doc.id] = {
                league,
                draftState: Object.assign(Object.assign({}, stateForDraft.draftState), { availablePlayers: stateForDraft.availablePlayers, selections: stateForDraft.selections }),
                chatMessages: [],
                playersByTeam: buildPlayersByTeam(league.lineupSettings, draftData.settings.draftOrder, linearizeSelections(stateForDraft.selections)),
            };
        }));
    });
    io.on("connection", (socket) => {
        connectedUsers[socket.data.user.uid] = socket.data.user;
        new DraftSocket(socket, io, socket.data.user);
    });
});
//# sourceMappingURL=index.js.map