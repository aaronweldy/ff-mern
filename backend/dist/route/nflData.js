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
import { fetchPlayers } from "../utils/fetchRoutes.js";
const router = Router();
router.get("/allPlayers/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const allPlayers = yield db.collection("globalPlayers").doc("players").get();
    if (!allPlayers.exists) {
        fetchPlayers().then((players) => {
            const deconstructedPlayers = players.map((player) => Object.assign({}, player));
            db.collection("globalPlayers")
                .doc("players")
                .set({ players: deconstructedPlayers });
            res.status(200).send(players);
        });
    }
    else {
        res.status(200).send({ players: allPlayers.data().players });
    }
}));
router.get("/nflSchedule/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const schedule = (yield db.collection("nflTeamSchedules").doc("dist").get()).data();
    res.status(200).send({ schedule });
}));
router.get("/nflDefenseStats/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = (yield db.collection("nflDefenseVsPositionStats").doc("dist").get()).data();
    res.status(200).send({ data });
}));
export default router;
//# sourceMappingURL=nflData.js.map