import { auth } from "../../config/firebase-config.js";
const connectedUsers = {};
const activeRooms = {};
export class DraftSocket {
    constructor(socket, io, user) {
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
    onJoinRoom(room) {
        var _a, _b;
        this.socket.join(room);
        if (!activeRooms[room]) {
            activeRooms[room] = {};
        }
        activeRooms[room][this.uid] = {};
        console.info("user", (_a = connectedUsers[this.uid]) === null || _a === void 0 ? void 0 : _a.email, "joined room", room);
        this.io.to(room).emit("user connection", {
            userId: this.uid,
            userEmail: (_b = connectedUsers[this.uid]) === null || _b === void 0 ? void 0 : _b.email,
            type: "connect",
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
        new DraftSocket(socket, io, socket.data.user);
    });
};
//# sourceMappingURL=index.js.map