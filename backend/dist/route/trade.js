import { Router } from "express";
import { db } from "../config/firebase-config.js";
const router = Router();
const addPlayerToTeam = (player, firstTeam, secondTeam) => {
    if (player.fromTeam === firstTeam.id) {
        firstTeam.rosteredPlayers.splice(firstTeam.rosteredPlayers.findIndex((p) => p.fullName === player.player.fullName), 1);
        secondTeam.rosteredPlayers.push(player.player);
    }
    else {
        secondTeam.rosteredPlayers.splice(secondTeam.rosteredPlayers.findIndex((p) => p.fullName === player.player.fullName), 1);
        firstTeam.rosteredPlayers.push(player.player);
    }
};
router.post("/propose/", async (req, res) => {
    const trade = req.body;
    db.collection("trades").doc(trade.id).set(trade);
    res.status(200).send();
});
router.delete("/:id/", async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const trade = await db.collection("trades").doc(id).get();
    if (!trade.exists) {
        res.status(404).send();
        return;
    }
    const tradeData = trade.data();
    const cancellingTeam = (await db.collection("teams").doc(tradeData.teamsInvolved[0]).get()).data();
    if (userId !== cancellingTeam.owner) {
        res.status(403).send();
        return;
    }
    db.collection("trades").doc(id).delete();
    res.status(200).send();
});
router.patch("/:id/reject/", async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const trade = await db.collection("trades").doc(id).get();
    if (!trade.exists) {
        res.status(403).send();
        return;
    }
    const tradeData = trade.data();
    const rejectingTeam = (await db.collection("teams").doc(tradeData.teamsInvolved[1]).get()).data();
    if (rejectingTeam.owner !== userId) {
        res.status(403).send();
        return;
    }
    tradeData.status = "rejected";
    await db.collection("trades").doc(id).set(tradeData);
    res.status(200).send();
});
router.patch("/:id/accept/", async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const trade = await db.collection("trades").doc(id).get();
    if (!trade.exists) {
        res.status(403).send();
        return;
    }
    const tradeData = trade.data();
    const proposingTeam = (await db.collection("teams").doc(tradeData.teamsInvolved[0]).get()).data();
    const acceptingTeam = (await db.collection("teams").doc(tradeData.teamsInvolved[1]).get()).data();
    if (acceptingTeam.owner !== userId) {
        res.status(403).send();
        return;
    }
    tradeData.players.forEach((player) => {
        addPlayerToTeam(player, proposingTeam, acceptingTeam);
    });
    tradeData.status = "accepted";
    await Promise.all([
        db.collection("teams").doc(proposingTeam.id).set(proposingTeam),
        db.collection("teams").doc(acceptingTeam.id).set(acceptingTeam),
        db.collection("trades").doc(id).set(tradeData),
    ]);
    res.status(200).send();
});
export default router;
//# sourceMappingURL=trade.js.map