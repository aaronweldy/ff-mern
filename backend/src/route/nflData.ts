import { Router } from "express";
import { db } from "../config/firebase-config.js";
import { fetchPlayers } from "../utils/fetchRoutes.js";

const router = Router();

router.get("/allPlayers/", async (req, res) => {
  const allPlayers = await db.collection("globalPlayers").doc("players").get();
  if (!allPlayers.exists) {
    fetchPlayers().then((players) => {
      const deconstructedPlayers = players.map((player) =>
        Object.assign({}, player)
      );
      db.collection("globalPlayers")
        .doc("players")
        .set({ players: deconstructedPlayers });
      res.status(200).send(players);
    });
  } else {
    res.status(200).send({ players: allPlayers.data().players });
  }
});

router.get("/nflSchedule/", async (req, res) => {
  const schedule = (
    await db.collection("nflTeamSchedules").doc("dist").get()
  ).data();
  res.status(200).send({ schedule });
});

router.get("/nflDefenseStats/", async (req, res) => {
  const data = (
    await db.collection("nflDefenseVsPositionStats").doc("dist").get()
  ).data();
  res.status(200).send({ data });
});

export default router;
