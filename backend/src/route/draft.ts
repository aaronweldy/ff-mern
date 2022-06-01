import {
  CreateDraftRequest,
  createDraftStateForLeague,
  League,
  ProjectedPlayer,
} from "@ff-mern/ff-types";
import { Router } from "express";
import { db } from "../config/firebase-config.js";
import { getTeamsInLeague } from "../utils/fetchRoutes.js";

const router = Router();

router.put("/create/", async (req, res) => {
  const { leagueId, draftSettings } = req.body as CreateDraftRequest;
  const [leagueDoc, teams, playersDoc] = await Promise.all([
    db.collection("leagues").doc(leagueId).get(),
    getTeamsInLeague(leagueId),
    db.collection("playerADP").orderBy("overall", "asc").get(),
  ]);
  const league = leagueDoc.data() as League;
  let players: ProjectedPlayer[] = [];
  playersDoc.forEach((doc) => {
    console.log(doc.data());
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
  console.log(draftData);
  db.collection("drafts").doc(draftSettings.draftId).set(draftData);
  res.status(200).send(draftData);
});

export default router;
