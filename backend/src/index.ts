"use strict";

import cors from "cors";
import express from "express";
import user from "./route/user.js";
import league from "./route/league.js";
import nflData from "./route/nflData.js";
import team from "./route/team.js";
import env from "dotenv";

const app = express();
env.config();

// env variables
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "50mb" }), cors());

app.get("/", (_, res) => {
  res.json({ message: "API working" });
});

app.use("/api/v1/user/", user);
app.use("/api/v1/league/", league);
app.use("/api/v1/team/", team);
app.use("/api/v1/nflData/", nflData);

app.all("*", (_, res) => {
  console.log("Returning a 404 from the catch-all route");
  return res.sendStatus(404);
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

/*export const stop = () => {
  app.close(PORT, () => {
    console.log(`Shut down on port: ${PORT}`);
  });
};
*/
