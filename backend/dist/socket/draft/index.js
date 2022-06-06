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
import { getCurrentPickInfo, } from "@ff-mern/ff-types";
import { auth, db } from "../../config/firebase-config.js";
import { rebuildPlayersAndSelections } from "./utils.js";
const connectedUsers = {};
const activeRooms = {};
const activeDrafts = {};
export class DraftSocket {
    constructor(socket, io, user) {
        this.io = io;
        this.socket = socket;
        this.uid = user.uid;
        socket.on("disconnect", () => this.onDisconnect());
        socket.on("join room", (room) => __awaiter(this, void 0, void 0, function* () { return this.onJoinRoom(room); }));
        socket.on("leave room", (room) => this.onLeaveRoom(room));
        socket.on("draftPick", (pick, room) => this.onDraftPick(pick, room));
    }
    syncToDb(roomId, draftPick) {
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
        const { availablePlayers, selections } = draftState, rest = __rest(draftState, ["availablePlayers", "selections"]);
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
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            this.socket.join(room);
            if (!activeRooms[room]) {
                activeRooms[room] = {};
            }
            let draftState = activeDrafts[room];
            if (!draftState) {
                const { draftState, availablePlayers, selections } = yield rebuildPlayersAndSelections(room);
                draftState.availablePlayers = availablePlayers;
                draftState.selections = selections;
                activeDrafts[room] = Object.assign(Object.assign({}, draftState), { availablePlayers, selections });
            }
            activeRooms[room][this.uid] = {};
            console.info("user", (_a = connectedUsers[this.uid]) === null || _a === void 0 ? void 0 : _a.email, "joined room", room);
            this.io.to(room).emit("user connection", {
                userId: this.uid,
                userEmail: (_b = connectedUsers[this.uid]) === null || _b === void 0 ? void 0 : _b.email,
                type: "connect",
            });
            this.socket.emit("sync", draftState);
        });
    }
    onLeaveRoom(room) {
        var _a, _b;
        this.socket.leave(room);
        delete activeRooms[room][this.uid];
        console.info("user", (_a = connectedUsers[this.uid]) === null || _a === void 0 ? void 0 : _a.email, "left room", room);
        this.io.to(room).emit("user connection", {
            userId: this.uid,
            userEmail: (_b = connectedUsers[this.uid]) === null || _b === void 0 ? void 0 : _b.email,
            type: "disconnect",
        });
    }
    onDraftPick(selection, room) {
        console.log("room", room, "received pick", selection);
        let draftState = activeDrafts[room];
        if (draftState) {
            const { round, pickInRound } = getCurrentPickInfo(draftState);
            draftState.selections[round][pickInRound] = selection;
            draftState.availablePlayers.splice(draftState.availablePlayers.findIndex((p) => p.sanitizedName === selection.player.sanitizedName), 1);
            draftState.currentPick += 1;
            activeDrafts[room] = draftState;
            this.io.to(room).emit("sync", draftState);
            this.syncToDb(room, selection);
        }
    }
}
export const initSocket = (io) => {
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
    io.on("connection", (socket) => {
        connectedUsers[socket.data.user.uid] = socket.data.user;
        db.collection("drafts")
            .where("phase", "==", "live")
            .get()
            .then((liveDrafts) => {
            liveDrafts.forEach((doc) => {
                activeDrafts[doc.id] = doc.data();
            });
        });
        new DraftSocket(socket, io, socket.data.user);
    });
};
//# sourceMappingURL=index.js.map