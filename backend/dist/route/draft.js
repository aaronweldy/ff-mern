var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { createDraftStateForLeague, } from "@ff-mern/ff-types";
import { Router } from "express";
import { db } from "../config/firebase-config.js";
import { activeDrafts } from "../socket/draft/index.js";
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
        players.push(doc.data());
    });
    const draftData = createDraftStateForLeague(league.lineupSettings, leagueId, teams, players, draftSettings.draftId, draftSettings);
    const draftRef = db.collection("drafts").doc(draftSettings.draftId);
    for (const player of draftData.availablePlayers) {
        draftRef.collection("availablePlayers").doc(player.fullName).set(player);
    }
    for (const round of Object.keys(draftData.selections)) {
        for (const pick of draftData.selections[round]) {
            draftRef
                .collection("selections")
                .doc(pick.pick.toString())
                .set(draftData.selections[round][pick.pick % draftData.settings.draftOrder.length]);
        }
    }
    const { availablePlayers, selections } = draftData, rest = __rest(draftData, ["availablePlayers", "selections"]);
    draftRef.set(rest);
    if (activeDrafts[draftSettings.draftId]) {
        activeDrafts[draftSettings.draftId].draftState = draftData;
    }
    res.status(200).send(draftData);
}));
router.delete("/:id/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield db.collection("drafts").doc(id).delete();
    res.status(200).send();
}));
export default router;
//# sourceMappingURL=draft.js.map