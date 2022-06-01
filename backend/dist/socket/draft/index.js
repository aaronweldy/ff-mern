var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { auth, db } from "../../config/firebase-config.js";
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
                const draftRef = yield db.collection("drafts").doc(room).get();
                if (draftRef.exists) {
                    draftState = draftRef.data();
                    if (draftState) {
                        activeDrafts[room] = draftState;
                    }
                }
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