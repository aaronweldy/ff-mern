import {
  FinalizedLineup,
  FinalizedPlayer,
  QuicksetLineupType,
  setPlayerName,
  Team,
  Week,
  NFLSchedule,
} from "@ff-mern/ff-types";
import { Router } from "express";
import admin, { db } from "../config/firebase-config.js";
import { fetchPlayerProjections } from "../utils/fetchRoutes.js";
import { findLineupChanges } from "../utils/findLineupChanges.js";
import { getNflSchedule } from "../utils/db.js";
const router = Router();

const hasPlayerAlreadyPlayed = (schedule: NFLSchedule, team: string, week: Week): boolean => {
  if (!schedule[team] || !schedule[team][week] || !schedule[team][week].gameTime) return false;
  const now = new Date();
  const gameDate = new Date(schedule[team][week].gameTime);
  return now > gameDate;
};

router.post("/validateTeams/", (req, res) => {
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

router.post("/updateTeams/", (req, res) => {
  const { teams } = req.body;
  for (const team of teams) {
    db.collection("teams")
      .doc(team.id)
      .update({ ...team, lastUpdated: new Date().toLocaleString() });
  }
  res.status(200).send({ teams });
});

router.put("/updateSingleTeam/", async (req, res) => {
  const { team, isAdmin } = req.body;
  console.log("Updating team: " + team.name + " by admin: " + isAdmin);
  try {
    const doc = db.collection("teams").doc(team.id);
    const prevData = (await doc.get()).data() as Team;
    const lineupDiff = findLineupChanges(prevData.weekInfo, team.weekInfo);

    const schedule = await getNflSchedule();
    for (const diff of lineupDiff) {
      if (!isAdmin && (
        (diff.oldPlayer && hasPlayerAlreadyPlayed(schedule, diff.oldPlayer.team, diff.week as Week)) ||
        (diff.newPlayer && hasPlayerAlreadyPlayed(schedule, diff.newPlayer.team, diff.week as Week)))
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

router.post("/setLineupFromProjection/", async (req, res) => {
  const {
    team,
    week,
    type,
  }: {
    team: Team;
    week: Week;
    type: QuicksetLineupType;
  } = req.body;
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
  const projections = await fetchPlayerProjections(week);
  const newLineup = { ...team.weekInfo[week].finalizedLineup };
  const usedPlayers = new Set<string>();
  for (const pos of Object.keys(
    team.weekInfo[weekNum].finalizedLineup
  ) as Array<keyof FinalizedLineup>) {
    if (pos === "bench") {
      continue;
    }
    const playerOptions = team.rosteredPlayers
      .filter(
        (player) =>
          pos.indexOf(player.position) > -1 &&
          !usedPlayers.has(player.sanitizedName)
      )
      .sort(
        (a, b) =>
          (projections[b.sanitizedName] || 0) -
          (projections[a.sanitizedName] || 0)
      );
    for (const player of playerOptions) {
      console.log(pos, player.fullName, projections[player.sanitizedName]);
    }
    for (let i = 0; i < newLineup[pos].length; i++) {
      if (i < playerOptions.length) {
        usedPlayers.add(playerOptions[i].sanitizedName);
        setPlayerName(newLineup[pos][i], playerOptions[i].fullName);
        newLineup[pos][i].team = playerOptions[i].team;
      } else {
        setPlayerName(newLineup[pos][i], "");
        newLineup[pos][i].team = "None";
      }
    }
  }
  newLineup.bench = team.rosteredPlayers
    .filter((player) => !usedPlayers.has(player.sanitizedName))
    .map((player) => {
      const newPlayer = new FinalizedPlayer(
        player.fullName,
        player.position,
        player.team,
        "bench"
      );
      return JSON.parse(JSON.stringify(newPlayer)) as FinalizedPlayer;
    });
  team.weekInfo[weekNum].finalizedLineup = newLineup;
  await db.collection("teams").doc(team.id).set(team);
  res.status(200).send({ team });
});

export default router;