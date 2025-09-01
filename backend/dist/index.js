"use strict";
import cors from "cors";
import express from "express";
import user from "./route/user.js";
import league from "./route/league.js";
import nflData from "./route/nflData.js";
import team from "./route/team.js";
import trade from "./route/trade.js";
import draft from "./route/draft.js";
import env from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./socket/draft/index.js";
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
initSocket(io);
env.config();
// env variables
const PORT = process.env.PORT || 3001;
app.use(express.json({ limit: "50mb" }), cors());
app.get("/", (_, res) => {
    res.json({ message: "API working with hot reload!" });
});
app.use("/api/v1/user/", user);
app.use("/api/v1/league/", league);
app.use("/api/v1/team/", team);
app.use("/api/v1/nflData/", nflData);
app.use("/api/v1/trade/", trade);
app.use("/api/v1/draft", draft);
app.all("*", (_, res) => {
    console.log("Returning a 404 from the catch-all route");
    return res.sendStatus(404);
});
server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});
//# sourceMappingURL=index.js.map