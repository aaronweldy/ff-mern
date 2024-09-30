import { instanceToPlain } from "class-transformer";
import { Router } from "express";
import { db } from "../config/firebase-config.js";
import { fetchPlayers } from "../utils/fetchRoutes.js";
import { NFLSchedule } from "@ff-mern/ff-types";

const router = Router();

router.get("/allPlayers/", async (_, res) => {
  const allPlayers = await db.collection("globalPlayers").doc("players").get();
  if (!allPlayers.exists) {
    fetchPlayers().then((players) => {
      const deconstructedPlayers = players.map((player) =>
        instanceToPlain(player)
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

router.get("/nflSchedule/", async (_, res) => {
  const schedule =
    await db.collection("nflSchedule").get();
  const resp: NFLSchedule = {}
  schedule.forEach((doc) => {
    resp[doc.id] = doc.data()
  })

  res.status(200).send(resp);
});

router.get("/nflDefenseStats/", async (_, res) => {
  const data = (
    await db.collection("nflDefenseVsPositionStats").doc("dist").get()
  ).data();
  res.status(200).send({ data });
});

export default router;
