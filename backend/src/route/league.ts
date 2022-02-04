/* eslint-disable no-mixed-spaces-and-tabs */
import { defaultScoringSettings } from "../constants/league.js";
import { Router } from "express";
import { v4 } from "uuid";
import admin, { db } from "../config/firebase-config.js";
import {
  League,
  sanitizePlayerName,
  ScoringError,
  Team,
  PlayerScoreData,
  PlayerScoresResponse,
  CumulativePlayerScores,
} from "@ff-mern/ff-types";
import {
  fetchPlayers,
  getTeamsInLeague,
  scoreAllPlayers,
} from "../utils/fetchRoutes.js";
import { updateCumulativeStats } from "../utils/updateCumulativeStats.js";

const router = Router();

type LeagueScoringDefault = "Standard" | "PPR";

router.get("/find/:query/", async (req, res) => {
  const query = req.params["query"];
  const startString = query.slice(0, 3);
  const cursor = await db
    .collection("leagues")
    .where("name", ">=", startString)
    .where("name", "<=", startString + "\uf8ff")
    .get();
  const foundLeagues: Record<string, FirebaseFirestore.DocumentData> = {};
  cursor.forEach((doc) => (foundLeagues[doc.id] = doc.data()));
  res.status(200).send(foundLeagues);
});

router.get("/:id/", async (req, res) => {
  const leagueId = req.params["id"];
  try {
    const teams = await getTeamsInLeague(leagueId);
    const league = (await db.collection("leagues").doc(leagueId).get()).data();
    res.status(200).json({ league, teams });
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

router.post("/create/", async (req, res) => {
  const { league, teams, logo, posInfo, scoring, numWeeks } = req.body;
  const leagueId = v4();
  db.collection("leagues")
    .doc(leagueId)
    .set({
      name: league,
      lineupSettings: posInfo,
      logo,
      numWeeks,
      lastScoredWeek: 0,
    })
    .then(async () => {
      let comms: string[] = [];
      for await (const team of teams) {
        const teamId = v4();
        console.log(team);
        await admin
          .auth()
          .getUserByEmail(team.ownerName)
          .then(async (user) => {
            db.collection("teams")
              .doc(teamId)
              .set({
                ...team,
                owner: user.uid,
                id: teamId,
                isCommissioner: team.isCommissioner || comms.includes(user.uid),
                league: leagueId,
                leagueLogo: logo,
              });
            if (team.isCommissioner) comms.push(user.uid);
          })
          .catch(async (err) => {
            console.log(err);
            db.collection("teams")
              .doc(teamId)
              .set({
                ...team,
                name: team.name,
                owner: "default",
                ownerName: "default",
                id: teamId,
                isCommissioner: false,
                league: leagueId,
                leagueLogo: logo,
              });
          });
      }
      db.collection("leagues")
        .doc(leagueId)
        .update({
          commissioners: comms,
          scoringSettings:
            scoring === "Custom"
              ? {}
              : defaultScoringSettings[scoring as LeagueScoringDefault],
        })
        .then(() => {
          res.status(200).json({ id: leagueId });
        });
    });
});

router.post("/:id/join/", async (req, res) => {
  const { id } = req.params;
  const { owner } = req.body;
  const firstValidTeam = await db
    .collection("teams")
    .where("league", "==", id)
    .where("owner", "==", "default")
    .limit(1)
    .get();
  let teamData: Team | null = null;
  if (firstValidTeam.empty) {
    res.status(409).send({ message: "League is full" });
  } else {
    firstValidTeam.forEach((doc) => {
      console.log(doc.data());
      teamData = doc.data() as Team;
    });
    console.log(firstValidTeam.size);
    admin
      .auth()
      .getUserByEmail(owner)
      .then(async (user) => {
        await db
          .collection("teams")
          .doc(teamData!.id)
          .update({ owner: user.uid, ownerName: owner });
        const respUrl = `/league/${id}/team/${teamData!.id}/`;
        res.status(200).json({ url: respUrl });
      })
      .catch((e) => {
        console.log(e);
        res.status(403).send("Invalid user.");
      });
  }
});

router.post("/:id/delete/", async (req, res) => {
  const { id } = req.params;
  const { user } = req.body;
  const leagueDoc = await db.collection("leagues").doc(id).get();
  if (!(leagueDoc.data() as League).commissioners.includes(user))
    return res
      .status(403)
      .send(
        "User is not a commissioner, and is therefore unauthorized to delete this league."
      );
  await db
    .collection("teams")
    .where("league", "==", id)
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        doc.ref.delete();
      });
    });
  leagueDoc.ref
    .delete()
    .then(() =>
      res.status(200).send({ message: "League deleted successfully" })
    );
});

router.get("/:leagueId/team/:id/", async (req, res) => {
  const team = await db.collection("teams").doc(req.params.id).get();
  res.status(200).json({
    team: team.data(),
  });
});

router.get("/:leagueId/teams/", async (req, res) => {
  const league = req.params["leagueId"];
  db.collection("teams")
    .where("league", "==", league)
    .get()
    .then((snapshot) => {
      const teams: Team[] = [];
      snapshot.forEach((data) => {
        teams.push(data.data() as Team);
      });
      res.status(200).json({ teams });
    });
});

router.post("/updateTeams/", (req, res) => {
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
            owner: user.uid,
          });
      })
      .catch(async () => {
        db.collection("teams")
          .doc(team.id)
          .update({
            owner: "default",
            ...team,
          });
      });
  });
  res.status(200).send({ teams });
});

router.post("/updateTeamInfo/", (req, res) => {
  const { id, url, name } = req.body;
  try {
    const doc = db.collection("teams").doc(id);
    doc.update({ logo: url, name }).then(async () => {
      const teamData = (await doc.get()).data();
      res.status(200).send({ team: teamData });
    });
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

router.post("/adjustTeamSettings/", (req, res) => {
  const { teams } = req.body;
  for (const team of teams) {
    db.collection("teams")
      .doc(team.id)
      .update({ ...team });
  }
  res.status(200).send({ message: "updated teams successfully" });
});

router.post("/:leagueId/updateScoringSettings/", async (req, res) => {
  const { settings } = req.body;
  const { leagueId } = req.params;
  db.collection("leagues")
    .doc(leagueId)
    .update({ scoringSettings: settings })
    .then(() => {
      res.status(200).send({ message: "updated settings successfully" });
    });
});

router.post("/:leagueId/update/", async (req, res) => {
  const { leagueId } = req.params;
  const {
    league,
    teams,
    deletedTeams,
  }: { league: League; teams: Team[]; deletedTeams: Team[] } = req.body;
  await db
    .collection("leagues")
    .doc(leagueId)
    .update({ ...league });
  for (const team of teams) {
    try {
      db.collection("teams")
        .doc(team.id)
        .update({
          ...team,
          leagueName: league.name,
          leagueLogo: league.logo,
        } as Team);
    } catch (e) {
      const teamId = v4();
      await admin
        .auth()
        .getUserByEmail(team.ownerName)
        .then(async (user) => {
          db.collection("teams")
            .doc(teamId)
            .set({
              name: team.name,
              owner: user.uid,
              ownerName: user.email,
              id: teamId,
              isCommissioner:
                team.isCommissioner || league.commissioners.includes(user.uid),
              league: leagueId,
              leagueName: league.name,
              leagueLogo: league.logo,
              logo: "/football.jfif",
              players: [],
              weekScores: [...Array(18).fill(0)],
              addedPoints: [],
            });
        })
        .catch(async () => {
          db.collection("teams")
            .doc(teamId)
            .set({
              name: team.name,
              owner: "default",
              ownerName: "default",
              id: teamId,
              isCommissioner: false,
              league: leagueId,
              leagueName: league.name,
              leagueLogo: league.logo,
              logo: "/football.jfif",
              players: [],
              weekScores: [...Array(18).fill(0)],
              addedPoints: [],
            });
        });
    }
  }
  for (const team of deletedTeams) {
    await db.collection("teams").doc(team.id).delete();
  }
  res.status(200).send("Updated all league settings");
});

router.post("/:leagueId/runScores/", async (req, res) => {
  const { week, teams }: { week: number; teams: Team[] } = req.body;
  const { leagueId } = req.params;
  const league = (
    await db.collection("leagues").doc(leagueId).get()
  ).data() as League;
  const errors: ScoringError[] = [];
  const data = await scoreAllPlayers(league, leagueId, week);
  console.log(data);
  teams.forEach(async (team) => {
    team.weekInfo[week].weekScore = 0;
    Object.values(team.weekInfo[week].finalizedLineup).forEach((players) => {
      players
        .filter((player) => player.name !== "")
        .forEach((player) => {
          const playerName = sanitizePlayerName(player.name);

          if (!(playerName in data)) {
            errors.push({
              type: "NOT FOUND",
              desc: "Player not found in database",
              player,
              team,
            });
            return;
          }

          if (
            data[playerName].scoring.totalPoints === 0 &&
            player.backup !== "None" &&
            player.backup !== "" &&
            player.lineup !== "bench"
          ) {
            errors.push({
              type: "POSSIBLE BACKUP",
              desc: "Player scored 0 points & may be eligible for a backup",
              player,
              team,
            });
          }
          if (player.lineup !== "bench") {
            team.weekInfo[week].weekScore +=
              data[playerName].scoring.totalPoints;
          }
        });
    });
    await db.collection("teams").doc(team.id).update(team);
  });
  await db.collection("leagues").doc(leagueId).update({ lastScoredWeek: week });
  res.status(200).json({ teams, errors, data });
  updateCumulativeStats(leagueId, week, data);
});

router.post("/:leagueId/playerScores/", async (req, res) => {
  const { leagueId } = req.params;
  const { players, week }: { players: string[]; week: number } = req.body;
  const teams = await getTeamsInLeague(leagueId);
  const league = (
    await db.collection("leagues").doc(leagueId).get()
  ).data() as League;

  if (week > league.lastScoredWeek) {
    const resp: PlayerScoresResponse = { teams, league, players: {} };
    res.status(200).send(resp);
    return;
  }
  const yearWeek = new Date().getFullYear() + week.toString();
  let data = (
    await db
      .collection("leagueScoringData")
      .doc(yearWeek + leagueId)
      .get()
  ).data() as { playerData: PlayerScoreData };

  if (!data) {
    const resp: PlayerScoresResponse = { teams, league, players: {} };
    res.status(200).send(resp);
    return;
  }

  if (!players) {
    const resp: PlayerScoresResponse = {
      teams,
      league,
      players: data.playerData,
    };
    res.status(200).send(resp);
    return;
  }

  const resp: PlayerScoresResponse = {
    teams,
    league,
    players: data.playerData,
  };
  res.status(200).send(resp);
});

router.get("/:id/cumulativePlayerScores/", async (req, res) => {
  const { id } = req.params;
  const cumulativeData = await db
    .collection("cumulativePlayerScores")
    .doc(id)
    .get();
  if (!cumulativeData.exists) {
    const curPlayers = await fetchPlayers();
    const initData = curPlayers.reduce(
      (acc: CumulativePlayerScores, player) => {
        acc[player.name] = {
          totalPointsInSeason: 0,
          pointsByWeek: Array(18).fill(0),
          position: player.position,
        };
        return acc;
      },
      {}
    );
    res.status(200).send(initData);
    db.collection("cumulativePlayerScores").doc(id).set(initData);
    return;
  }
  const retData = cumulativeData.data() as CumulativePlayerScores;
  const sortedData = Object.keys(retData)
    .sort((a, b) => {
      return retData[b].totalPointsInSeason - retData[a].totalPointsInSeason;
    })
    .reduce((acc: CumulativePlayerScores, i: string) => {
      acc[i] = retData[i];
      return acc;
    }, {});
  res.status(200).send(sortedData);
});

export default router;
