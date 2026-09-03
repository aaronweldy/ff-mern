import {
  CreateDraftRequest,
  createDraftStateForLeague,
  League,
  ProjectedPlayer,
} from "@ff-mern/ff-types";
import { Router } from "express";
import { db } from "../config/firebase-config.js";
import { activeDrafts } from "../socket/draft/index.js";
import { getTeamsInLeague } from "../utils/fetchRoutes.js";
import {
  isLeagueCommissioner,
  requireAuth,
} from "../middleware/auth.js";

const router = Router();

router.put("/create/", requireAuth, async (req, res) => {
  const { leagueId, draftSettings } = req.body as CreateDraftRequest;
  if (!(await isLeagueCommissioner(leagueId, req.user!.uid))) {
    res.status(403).send("Only commissioners may create a draft.");
    return;
  }
  const [leagueDoc, teams, playersDoc] = await Promise.all([
    db.collection("leagues").doc(leagueId).get(),
    getTeamsInLeague(leagueId),
    db.collection("playerADP").orderBy("overall", "asc").get(),
  ]);
  const league = leagueDoc.data() as League;
  let players: ProjectedPlayer[] = [];
  playersDoc.forEach((doc) => {
    players.push(doc.data() as ProjectedPlayer);
  });
  const draftData = createDraftStateForLeague(
    league.lineupSettings,
    leagueId,
    teams,
    players,
    draftSettings.draftId,
    draftSettings
  );
  const draftRef = db.collection("drafts").doc(draftSettings.draftId);
  for (const player of draftData.availablePlayers) {
    draftRef.collection("availablePlayers").doc(player.fullName).set(player);
  }
  for (const round of Object.keys(draftData.selections)) {
    for (const pick of draftData.selections[round]) {
      draftRef
        .collection("selections")
        .doc(pick.pick.toString())
        .set(
          draftData.selections[round][
            pick.pick % draftData.settings.draftOrder.length
          ]
        );
    }
  }
  const { availablePlayers, selections, ...rest } = draftData;
  draftRef.set(rest);
  if (activeDrafts[draftSettings.draftId]) {
    activeDrafts[draftSettings.draftId].draftState = draftData;
  }
  res.status(200).send(draftData);
});

router.delete("/:id/", requireAuth, async (req, res) => {
  const { id } = req.params;
  const draftDoc = await db.collection("drafts").doc(id).get();
  if (draftDoc.exists) {
    const leagueId = (draftDoc.data() as { leagueId?: string }).leagueId;
    if (
      leagueId &&
      !(await isLeagueCommissioner(leagueId, req.user!.uid))
    ) {
      res.status(403).send("Only commissioners may delete a draft.");
      return;
    }
  }
  await db.collection("drafts").doc(id).delete();
  res.status(200).send();
});

export default router;
