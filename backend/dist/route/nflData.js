import { instanceToPlain } from "class-transformer";
import { Router } from "express";
import { db } from "../config/firebase-config.js";
import { fetchPlayers } from "../utils/fetchRoutes.js";
import { RosteredPlayer } from "@ff-mern/ff-types";
const router = Router();
router.get("/allPlayers/", async (_, res) => {
    const allPlayers = await db.collection("globalPlayers").doc("players").get();
    if (!allPlayers.exists) {
        fetchPlayers().then((players) => {
            const deconstructedPlayers = players.map((player) => instanceToPlain(player));
            db.collection("globalPlayers")
                .doc("players")
                .set({ players: deconstructedPlayers });
            res.status(200).send(players);
        });
    }
    else {
        res.status(200).send({ players: allPlayers.data().players });
    }
});
router.post("/syncPlayers/", async (_, res) => {
    try {
        const players = await fetchPlayers();
        const deconstructedPlayers = players.map((player) => instanceToPlain(player));
        await db
            .collection("globalPlayers")
            .doc("players")
            .set({ players: deconstructedPlayers });
        res.status(200).send({ players: deconstructedPlayers });
    }
    catch (error) {
        console.error("Error syncing players:", error);
        res.status(500).send({ error: "Failed to sync players" });
    }
});
router.post("/addPlayer/", async (req, res) => {
    try {
        const { fullName, team, position } = req.body;
        if (!fullName || !team || !position) {
            res.status(400).send({ error: "Missing required fields: fullName, team, position" });
            return;
        }
        const allPlayersDoc = await db.collection("globalPlayers").doc("players").get();
        const existingPlayers = allPlayersDoc.exists ? allPlayersDoc.data()?.players || [] : [];
        const newPlayer = new RosteredPlayer(fullName, team, position);
        const deconstructedPlayer = instanceToPlain(newPlayer);
        existingPlayers.push(deconstructedPlayer);
        await db
            .collection("globalPlayers")
            .doc("players")
            .set({ players: existingPlayers });
        res.status(200).send({ players: existingPlayers });
    }
    catch (error) {
        console.error("Error adding player:", error);
        res.status(500).send({ error: "Failed to add player" });
    }
});
router.get("/nflSchedule/", async (_, res) => {
    const schedule = await db.collection("nflSchedule").get();
    const resp = {};
    schedule.forEach((doc) => {
        resp[doc.id] = doc.data();
    });
    res.status(200).send(resp);
});
router.get("/nflDefenseStats/", async (_, res) => {
    const data = (await db.collection("nflDefenseVsPositionStats").doc("dist").get()).data();
    res.status(200).send({ data });
});
export default router;
//# sourceMappingURL=nflData.js.map