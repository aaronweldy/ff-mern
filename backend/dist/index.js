"use strict";
import cors from "cors";
import express from "express";
import user from "./route/user.js";
import league from "./route/league.js";
import env from "dotenv";
const app = express();
env.config();
// env variables
const PORT = process.env.PORT || 3001;
app.use(express.json({ limit: "50mb" }), cors());
app.get("/", (req, res) => {
    res.json({ message: "API working" });
});
app.use("/api/v1/user/", user);
app.use("/api/v1/league/", league);
app.all("*", (request, response) => {
    console.log("Returning a 404 from the catch-all route");
    return response.sendStatus(404);
});
app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});
//# sourceMappingURL=index.js.map