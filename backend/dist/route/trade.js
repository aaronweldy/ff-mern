var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
router.post("/propose/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const trade = req.body;
    db.collection("trades").doc(trade.id).set(trade);
    res.status(200).send();
}));
router.delete("/:id/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.body;
    const trade = yield db.collection("trades").doc(id).get();
    if (!trade.exists) {
        res.status(404).send();
        return;
    }
    const tradeData = trade.data();
    const cancellingTeam = (yield db.collection("teams").doc(tradeData.teamsInvolved[0]).get()).data();
    if (userId !== cancellingTeam.owner) {
        res.status(403).send();
        return;
    }
    db.collection("trades").doc(id).delete();
    res.status(200).send();
}));
router.patch("/:id/reject/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.body;
    const trade = yield db.collection("trades").doc(id).get();
    if (!trade.exists) {
        res.status(403).send();
        return;
    }
    const tradeData = trade.data();
    const rejectingTeam = (yield db.collection("teams").doc(tradeData.teamsInvolved[1]).get()).data();
    if (rejectingTeam.owner !== userId) {
        res.status(403).send();
        return;
    }
    tradeData.status = "rejected";
    yield db.collection("trades").doc(id).set(tradeData);
    res.status(200).send();
}));
router.patch("/:id/accept/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.body;
    const trade = yield db.collection("trades").doc(id).get();
    if (!trade.exists) {
        res.status(403).send();
        return;
    }
    const tradeData = trade.data();
    const proposingTeam = (yield db.collection("teams").doc(tradeData.teamsInvolved[0]).get()).data();
    const acceptingTeam = (yield db.collection("teams").doc(tradeData.teamsInvolved[1]).get()).data();
    if (acceptingTeam.owner !== userId) {
        res.status(403).send();
        return;
    }
    tradeData.players.forEach((player) => {
        addPlayerToTeam(player, proposingTeam, acceptingTeam);
    });
    tradeData.status = "accepted";
    yield Promise.all([
        db.collection("teams").doc(proposingTeam.id).set(proposingTeam),
        db.collection("teams").doc(acceptingTeam.id).set(acceptingTeam),
        db.collection("trades").doc(id).set(tradeData),
    ]);
    res.status(200).send();
}));
export default router;
//# sourceMappingURL=trade.js.map