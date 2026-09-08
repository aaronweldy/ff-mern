"use strict";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import user from "./route/user.js";
import league from "./route/league.js";
import nflData from "./route/nflData.js";
import team from "./route/team.js";
import trade from "./route/trade.js";
import draft from "./route/draft.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./socket/draft/index.js";
import { requireAuth } from "./middleware/auth.js";
const app = express();
const server = createServer(app);
// CORS allowlist from env (FRONTEND_URL) + local dev. Firebase Hosting
// preview channels use a unique hostname for every PR, for example:
//   https://ff-mern--pr14-codex-historical-cum-lsubcwtv.web.app
// Keep the pattern scoped to this Firebase site instead of allowing every
// *.web.app origin.
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
].filter((o) => Boolean(o));
const firebasePreviewOrigin = /^https:\/\/ff-mern--[a-z0-9-]+\.web\.app$/i;
const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin) || firebasePreviewOrigin.test(origin);
const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser clients (no Origin header) and allowlisted origins.
        // Returning false for an unknown origin lets the request finish normally
        // without turning a rejected CORS preflight into a 500 response.
        callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
};
const io = new Server(server, {
    cors: {
        origin: [...allowedOrigins, firebasePreviewOrigin],
        methods: ["GET", "POST"],
        credentials: true,
    },
});
initSocket(io);
// env variables
const PORT = process.env.PORT || 3001;
app.use(helmet());
app.use(cors(corsOptions));
// Global rate limiter for all API traffic
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(apiLimiter);
// Body parsing: 1mb default, larger allowance for the photo upload route.
// The global parser skips updatePhoto paths so the route-specific
// `express.json({ limit: "10mb" })` in the user router does the parsing.
const jsonDefault = express.json({ limit: "1mb" });
const jsonPhotoUpload = express.json({ limit: "10mb" });
app.use((req, res, next) => {
    if (req.path.includes("updatePhoto")) {
        return jsonPhotoUpload(req, res, next);
    }
    return jsonDefault(req, res, next);
});
// Require Firebase Auth for every mutating API request.
// GET/HEAD/OPTIONS stay public (individual routers additionally enforce
// requireAuth on their POST/PATCH/PUT/DELETE routes for defense in depth).
app.use("/api/v1", (req, res, next) => {
    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
        return requireAuth(req, res, next);
    }
    next();
});
app.get("/", (_, res) => {
    res.json({ message: "API working with hot reload!" });
});
app.use("/api/v1/user/", user);
app.use("/api/v1/league/", league);
app.use("/api/v1/team/", team);
app.use("/api/v1/nflData/", nflData);
app.use("/api/v1/trade/", trade);
app.use("/api/v1/draft", draft);
// Global error handler: a single bad request must never kill the process
// (Express 4 does not catch async throws on its own).
app.use((err, _req, res, _next) => {
    console.error("Unhandled route error", err);
    if (!res.headersSent) {
        res.status(500).send({ error: "Internal server error." });
    }
});
app.all("*", (_, res) => {
    console.log("Returning a 404 from the catch-all route");
    return res.sendStatus(404);
});
server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});
//# sourceMappingURL=index.js.map