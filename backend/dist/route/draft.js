var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createDraftStateForLeague, } from "@ff-mern/ff-types";
import { Router } from "express";
import { db } from "../config/firebase-config.js";
import { getTeamsInLeague } from "../utils/fetchRoutes.js";
const router = Router();
router.put("/create/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { leagueId, draftSettings } = req.body;
    const [leagueDoc, teams, playersDoc] = yield Promise.all([
        db.collection("leagues").doc(leagueId).get(),
        getTeamsInLeague(leagueId),
        db.collection("playerADP").orderBy("overall", "asc").get(),
    ]);
    const league = leagueDoc.data();
    let players = [];
    playersDoc.forEach((doc) => {
        console.log(doc.data());
        players.push(doc.data());
    });
    const draftData = createDraftStateForLeague(league.lineupSettings, leagueId, teams, players, draftSettings.draftId, draftSettings);
    console.log(draftData);
    db.collection("drafts").doc(draftSettings.draftId).set(draftData);
    res.status(200).send(draftData);
}));
export default router;
//# sourceMappingURL=draft.js.map