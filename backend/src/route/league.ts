/* eslint-disable no-mixed-spaces-and-tabs */
// @ts-ignore
import scraper from "table-scraper";
import {
  convertedScoringTypes,
  defaultScoringSettings,
} from "../constants/league.js";
import { Router } from "express";
import { v4 } from "uuid";
import admin, { db } from "../config/firebase-config.js";
import {
  DatabasePlayer,
  League,
  ScoringError,
  StatKey,
  Team,
} from "@ff-mern/ff-types";

const router = Router();

const positions = ["qb", "rb", "wr", "te", "k"];

type LeagueScoringDefault = "Standard" | "PPR";
type ScrapedPlayer = Record<string, string>;

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

router.get("/allPlayers/", async (req, res) => {
  const allPlayers = await db.collection("globalPlayers").doc("players").get();
  if (!allPlayers.exists) {
    let players: string[] = [];
    for (const pos of positions) {
      const url = `https://www.fantasypros.com/nfl/projections/${pos}.php`;
      const tableData = await scraper.get(url);
      for (const player of tableData[0] as ScrapedPlayer[]) {
        const segments = player.Player.split(" ");
        if (segments.length > 0) {
          players.push(segments.slice(0, segments.length - 1).join(" "));
        }
      }
    }
    db.collection("globalPlayers").doc("players").set({ players });
    res.status(200).send(players);
  } else {
    res.status(200).send({ players: allPlayers.data() });
  }
});

router.get("/:id/", async (req, res) => {
  const leagueId = req.params["id"];
  try {
    db.collection("teams")
      .where("league", "==", leagueId)
      .get()
      .then((teamSnapshot) => {
        const teams: Team[] = [];
        teamSnapshot.forEach((teamData) => {
          teams.push(teamData.data() as Team);
        });
        db.collection("leagues")
          .doc(leagueId)
          .get()
          .then((league) => {
            res.status(200).json({ league: league.data(), teams });
          });
      });
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
        db.collection("teams").doc(team.id).update({
          name: team.name,
          owner: user.uid,
          ownerName: team.ownerName,
          players: team.players,
        });
      })
      .catch(async () => {
        db.collection("teams").doc(team.id).update({
          name: team.name,
          owner: "default",
          ownerName: "default",
          players: team.players,
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
  const { week } = req.body;
  const { leagueId } = req.params;
  const league: League = (
    await db.collection("leagues").doc(leagueId).get()
  ).data() as League;
  const teams: Team[] = [];
  const errors: ScoringError[] = [];
  const year = new Date().getFullYear();
  await db
    .collection("teams")
    .where("league", "==", leagueId)
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => teams.push(doc.data() as Team));
    });
  let statsAtt = await db
    .collection("weekStats")
    .doc(year + "week" + week)
    .get();
  let usableStats: Record<string, DatabasePlayer> = {};
  if (!statsAtt.exists) {
    for await (const pos of positions) {
      const url = `https://www.fantasypros.com/nfl/stats/${pos}.php?year=${year}&week=${week}&range=week`;
      const table = await scraper.get(url);
      for (const player of table[0]) {
        const hashedName = player["Player"].replace(/\./g, "").toLowerCase();
        if (hashedName) {
          usableStats[hashedName.slice(0, hashedName.indexOf("(") - 1)] =
            pos === "QB"
              ? {
                  ...player,
                  "CP%":
                    Number.parseFloat(player["CMP"]) /
                    Number.parseFloat(player["ATT"]),
                  "Y/A":
                    Number.parseFloat(player["YDS"]) /
                    Number.parseFloat(player["ATT"]),
                }
              : player;
        }
      }
    }
    await db
      .collection("weekStats")
      .doc(year + "week" + week)
      .set({ usableStats });
  } else {
    usableStats = (
      statsAtt.data() as { playerMap: Record<string, DatabasePlayer> }
    ).playerMap;
  }
  for await (const team of teams) {
    team.weekScores[week] = 0;
    team.players
      .filter((player) => player.lineup[week] !== "bench")
      .forEach((player) => {
        const playerName = player.name.replace(/\./g, "").toLowerCase();
        if (!Object.keys(usableStats).includes(playerName)) {
          errors.push({
            type: "NOT FOUND",
            desc: "Player not found in database",
            player,
            team,
          });
          player["error"] = true;
          player.points[week] = 0;
          return;
        }
        const catPoints = league.scoringSettings
          .filter((set) => set.position.indexOf(player.position) >= 0)
          .map((category) => {
            player.error = false;
            const cat = category["category"];
            const hashVal =
              cat.qualifier === "between"
                ? `${cat.qualifier}|${cat.thresholdMax}${cat.thresholdMin}|${cat.statType}`
                : `${cat.qualifier}|${cat.threshold}|${cat.statType}`;
            let points = 0;
            try {
              const statNumber = Number.parseFloat(
                usableStats[playerName][
                  convertedScoringTypes[player.position][
                    cat.statType
                  ] as StatKey
                ]
              );
              if (isNaN(statNumber)) return { hashVal: 0 };
              switch (cat.qualifier) {
                case "per":
                  console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
                  points = (statNumber / cat.threshold) * category.points;
                  break;
                case "greater than":
                  console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
                  if (statNumber >= cat.threshold) points = category.points;
                  break;
                case "between":
                  if (
                    statNumber >= (cat.thresholdMin || Infinity) &&
                    statNumber <= (cat.thresholdMax || -Infinity)
                  )
                    points = category.points;
                  break;
              }
              const successMins = category.minimums.filter((min) => {
                const statNumber = Number.parseFloat(
                  usableStats[playerName][
                    convertedScoringTypes[player.position][
                      min.statType
                    ] as StatKey
                  ]
                );
                return statNumber > min.threshold;
              });
              let retObj: Record<string, number> = {};
              retObj[hashVal] =
                successMins.length === category.minimums.length ? points : 0;
              return retObj;
            } catch (error) {
              console.log(
                `Error finding stats for player ${player.name}, ${player.lineup[week]}`
              );
              return { hashVal: 0 };
            }
          });
        player.weekStats[week] = Object.assign({}, ...catPoints);
        player.points[week] = Number.parseFloat(
          catPoints
            .reduce((acc, i) => acc + Object.values(i)[0], 0)
            .toPrecision(4)
        );
        console.log(player.backup);
        if (player.points[week] === 0 && player?.backup[week]) {
          errors.push({
            type: "POSSIBLE BACKUP",
            desc: "Player scored 0 points & may be eligible for a backup",
            player,
            team,
          });
        }
      });
    const weekScore = team.players
      .filter((player) => player.lineup[week] !== "bench")
      .reduce(
        (acc, player) =>
          player.points[week] ? acc + player.points[week] : acc,
        0
      );
    console.log(team.weekScores);
    team.weekScores[week] = weekScore;
    await db
      .collection("teams")
      .doc(team.id)
      .update({ ...team });
  }
  await db.collection("leagues").doc(leagueId).update({ lastScoredWeek: week });
  res.status(200).json({ teams, errors });
});

export default router;
