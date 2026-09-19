import {
  AbbreviatedNflTeam,
  AbbreviationToFullTeam,
  FinalizedLineup,
  LineupSettings,
  NFLSchedule,
  QuicksetLineupType,
  Team,
  Week,
} from "@ff-mern/ff-types";
import { Router } from "express";
import admin, { db } from "../config/firebase-config.js";
import { getNflSchedule } from "../utils/db.js";
import { fetchPlayerProjections } from "../utils/fetchRoutes.js";
import { findLineupChanges } from "../utils/findLineupChanges.js";
import {
  isLeagueCommissioner,
  requireAuth,
} from "../middleware/auth.js";
import { buildProjectedLineup } from "../utils/projectedLineup.js";
const router = Router();

// Typeguard to check if a team is a valid NFL team (not "None")
const isValidNflTeam = (team: AbbreviatedNflTeam | "None"): team is AbbreviatedNflTeam => {
  return team !== "None";
};

const hasPlayerAlreadyPlayed = (schedule: NFLSchedule, team: AbbreviatedNflTeam, week: Week): boolean => {
  const fullTeam = AbbreviationToFullTeam[team];
  if (!schedule[fullTeam] || !schedule[fullTeam][week] || !schedule[fullTeam][week].gameTime) return false;
  const now = new Date();
  const gameDate = new Date(schedule[fullTeam][week].gameTime);
  return now > gameDate;
};

/** Server-side ownership/commissioner check; never trust client isAdmin. */
const canModifyTeam = async (uid: string, teamId: string): Promise<boolean> => {
  const doc = await db.collection("teams").doc(teamId).get();
  if (!doc.exists) return false;
  const team = doc.data() as Team;
  if (team.owner === uid) return true;
  return isLeagueCommissioner(team.league, uid);
};

router.post("/validateTeams/", requireAuth, (req, res) => {
  const { teams } = req.body;
  teams.forEach((team: Team) => {
    admin
      .auth()
      .getUserByEmail(team.ownerName)
      .then(async (user) => {
        db.collection("teams")
          .doc(team.id)
          .update({
            ...team,
            lastUpdated: new Date().toLocaleString(),
            owner: user.uid,
          });
      })
      .catch(async () => {
        db.collection("teams")
          .doc(team.id)
          .update({
            owner: "default",
            lastUpdated: new Date().toLocaleString(),
            ...team,
          });
      });
  });
  res.status(200).send({ teams });
});

router.post("/updateTeams/", requireAuth, async (req, res) => {
  const { teams } = req.body;
  const uid = req.user!.uid;
  for (const team of teams as Team[]) {
    if (!(await canModifyTeam(uid, team.id))) {
      res.status(403).send({ error: `Not authorized to update team ${team.id}` });
      return;
    }
  }
  for (const team of teams as Team[]) {
    db.collection("teams")
      .doc(team.id)
      .update({ ...team, lastUpdated: new Date().toLocaleString() });
  }
  res.status(200).send({ teams });
});

router.put("/updateSingleTeam/", requireAuth, async (req, res) => {
  const { team } = req.body as { team: Team; isAdmin?: boolean };
  const uid = req.user!.uid;
  // Ownership verified server-side against the stored team, not req.body.
  const doc = db.collection("teams").doc(team.id);
  const prevData = (await doc.get()).data() as Team | undefined;
  if (!prevData) {
    res.status(404).send();
    return;
  }
  const isOwner = prevData.owner === uid;
  const isCommissioner = await isLeagueCommissioner(prevData.league, uid);
  const isAdmin = isOwner || isCommissioner;
  if (!isAdmin) {
    console.log(`Forbidden team update: ${team.name} by ${uid}`);
    res.status(403).send("Not authorized to update this team");
    return;
  }
  console.log("Updating team: " + team.name + " by admin: " + isAdmin);
  try {
    const lineupDiff = findLineupChanges(prevData.weekInfo, team.weekInfo);

    const schedule = await getNflSchedule();
    for (const diff of lineupDiff) {
      if (!isAdmin && (
        (diff.oldPlayer && isValidNflTeam(diff.oldPlayer.team) && hasPlayerAlreadyPlayed(schedule, diff.oldPlayer.team, diff.week as Week)) ||
        (diff.newPlayer && isValidNflTeam(diff.newPlayer.team) && hasPlayerAlreadyPlayed(schedule, diff.newPlayer.team, diff.week as Week)))
      ) {
        return res.status(400).send("Cannot modify lineup for players who have already played");
      }
    }

    doc
      .set({ ...team, lastUpdated: new Date().toLocaleString() })
      .then(async () => {
        const teamData = (await doc.get()).data();
        res.status(200).send({ team: teamData });
      });
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

router.get("/:id/", async (req, res) => {
  const team = await db.collection("teams").doc(req.params.id).get();
  res.status(200).json({
    team: team.data(),
  });
});

router.post("/setLineupFromProjection/", requireAuth, async (req, res) => {
  const {
    team,
    week,
    type,
    lineupSettings,
  }: {
    team: Team;
    week: Week;
    type: QuicksetLineupType;
    lineupSettings?: LineupSettings;
  } = req.body;
  if (!(await canModifyTeam(req.user!.uid, team.id))) {
    res.status(403).send("Not authorized to update this team");
    return;
  }
  console.log(team.name);
  const weekNum = parseInt(week);
  if (type === "LastWeek" && parseInt(week) > 1) {
    team.weekInfo[weekNum].finalizedLineup =
      team.weekInfo[weekNum - 1].finalizedLineup;
    await db.collection("teams").doc(team.id).set(team);
    res.status(200).send({ team });
    return;
  } else if (type === "LastWeek") {
    res.status(401).send();
    return;
  }
  let projections: Record<string, number>;
  try {
    projections = await fetchPlayerProjections(week);
  } catch (error) {
    console.error(`Projection fetch failed for week ${week}`, error);
    res.status(503).send({
      message: `Complete projections are unavailable for week ${week}. Your lineup has not been changed. Please try again later.`,
    });
    return;
  }
  let newLineup: FinalizedLineup;
  try {
    newLineup = buildProjectedLineup(team.rosteredPlayers, team.weekInfo[week].finalizedLineup, projections, lineupSettings);
  } catch (error) {
    res.status(422).send({ message: error instanceof Error ? error.message : "Unable to build the projected lineup." });
    return;
  }
  team.weekInfo[weekNum].finalizedLineup = newLineup;
  await db.collection("teams").doc(team.id).set(team);
  res.status(200).send({ team });
});

export default router;
