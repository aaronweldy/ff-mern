import { createDraftStateForLeague, } from "@ff-mern/ff-types";
import { Router } from "express";
import { db } from "../config/firebase-config.js";
import { activeDrafts } from "../socket/draft/index.js";
import { getTeamsInLeague } from "../utils/fetchRoutes.js";
const router = Router();
router.put("/create/", async (req, res) => {
    const { leagueId, draftSettings } = req.body;
    const [leagueDoc, teams, playersDoc] = await Promise.all([
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
    const { availablePlayers, selections, ...rest } = draftData;
    draftRef.set(rest);
    if (activeDrafts[draftSettings.draftId]) {
        activeDrafts[draftSettings.draftId].draftState = draftData;
    }
    res.status(200).send(draftData);
});
router.delete("/:id/", async (req, res) => {
    const { id } = req.params;
    await db.collection("drafts").doc(id).delete();
    res.status(200).send();
});
export default router;
//# sourceMappingURL=draft.js.map