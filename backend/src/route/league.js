import scraper from "table-scraper";
import {
  convertedScoringTypes,
  defaultScoringSettings,
  lineupOrder,
} from "../constants/league.js";
import { Router } from "express";
import { v4 } from "uuid";
import admin, { db } from "../config/firebase-config.js";

const router = Router();

const positions = ["qb", "rb", "wr", "te", "k"];

const lineupSorter = (a, b) => lineupOrder[b] - lineupOrder[a];

router.get("/:id/", async (req, res) => {
  const leagueId = req.params["id"];
  try {
    db.collection("teams")
      .where("league", "==", leagueId)
      .get()
      .then((teamSnapshot) => {
        const teams = [];
        teamSnapshot.forEach((teamData) => {
          teams.push(teamData.data());
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
      let comms = [];
      for await (const team of teams) {
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
                isCommissioner: team.isCommissioner || comms.includes(user.uid),
                league: leagueId,
                leagueName: league,
                leagueLogo: logo,
                logo: "/football.jfif",
                players: [],
                weekScores: [...Array(18).fill(0)],
                addedPoints: [],
              });
            if (team.isCommissioner) comms.push(user.uid);
          })
          .catch(async (err) => {
            console.log(err);
            db.collection("teams")
              .doc(teamId)
              .set({
                name: team.name,
                owner: "default",
                ownerName: "default",
                id: teamId,
                isCommissioner: false,
                league: leagueId,
                leagueName: league,
                leagueLogo: logo,
                logo: "/football.jfif",
                players: [],
                weekScores: [...Array(18).fill(0)],
                addedPoints: [],
              });
          });
      }
      db.collection("leagues")
        .doc(leagueId)
        .update({
          commissioners: comms,
          scoringSettings:
            scoring === "Custom" ? {} : defaultScoringSettings[scoring],
        })
        .then(() => {
          res.status(200).json({ id: leagueId });
        });
    });
});

router.post("/:id/delete/", async (req, res) => {
  const { id } = req.params;
  const { user } = req.body;
  const leagueDoc = await db.collection("leagues").doc(id).get();
  if (!leagueDoc.data().commissioners.includes(user))
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
      const teams = [];
      snapshot.forEach((data) => {
        teams.push(data.data());
      });
      res.status(200).json({ teams });
    });
});

router.post("/updateTeams/", (req, res) => {
  const { teams } = req.body;
  teams.forEach((team) => {
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
      .catch(async (_) => {
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

router.post("/updateTeamLogo/", (req, res) => {
  const { id, url } = req.body;
  try {
    const doc = db.collection("teams").doc(id);
    doc.update({ logo: url }).then(async () => {
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
  const { league, teams, deletedTeams } = req.body;
  await db
    .collection("leagues")
    .doc(leagueId)
    .update({ ...league });
  for (const team of teams) {
    try {
      db.collection("teams")
        .doc(team.id)
        .update({ ...team });
    } catch (e) {
      const teamId = v4();
      await admin
        .auth()
        .getUserByEmail(team.teamOwner)
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
          if (team.isCommissioner) comms.push(user.uid);
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
  const league = (await db.collection("leagues").doc(leagueId).get()).data();
  const teams = [];
  const errors = [];
  const year = new Date().getFullYear();
  await db
    .collection("teams")
    .where("league", "==", leagueId)
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => teams.push(doc.data()));
    });
  let statsAtt = await db
    .collection("weekStats")
    .doc(year + "week" + week)
    .get();
  if (!statsAtt[0]) {
    const playerMap = {};
    for await (const pos of positions) {
      const url = `https://www.fantasypros.com/nfl/stats/${pos}.php?year=${year}&week=${week}&range=week`;
      const table = await scraper.get(url);
      for (const player of table[0]) {
        const hashedName = player["Player"].replace(/\./g, "").toLowerCase();
        if (hashedName) {
          playerMap[hashedName.slice(0, hashedName.indexOf("(") - 1)] =
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
      .set({ playerMap })
      .then(() => {
        statsAtt = { playerMap };
      });
  } else {
    statsAtt = statsAtt[0].data();
  }
  for await (const team of teams) {
    team.weekScores[week] = 0;
    team.players
      .filter((player) => player.lineup[week] !== "bench")
      .forEach((player) => {
        if (
          !Object.keys(statsAtt.playerMap).includes(player.name.toLowerCase())
        ) {
          errors.push({
            type: "e",
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
                ? `${cat.qualifier}|${cat.threshold_1}${cat.threshold_2}|${cat.statType}`
                : `${cat.qualifier}|${cat.threshold}|${cat.statType}`;
            let points = 0;
            try {
              const statNumber = Number.parseFloat(
                statsAtt.playerMap[player.name.toLowerCase()][
                  convertedScoringTypes[player.position][cat.statType]
                ]
              );
              if (isNaN(statNumber)) return { hashVal: 0 };
              switch (cat.qualifier) {
                case "per":
                  console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
                  points =
                    (statNumber / Number.parseFloat(cat.threshold)) *
                    Number.parseFloat(category.points);
                  break;
                case "greater than":
                  console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
                  if (statNumber > Number.parseFloat(cat.threshold))
                    points = Number.parseFloat(category.points);
                  break;
                case "between":
                  if (
                    statNumber >= cat.threshold_1 &&
                    statNumber <= cat.threshold_2
                  )
                    points = Number.parseFloat(category.points);
                  break;
              }
              const successMins = category.minimums.filter((min) => {
                const statNumber = Number.parseFloat(
                  statsAtt.playerMap[player.name][
                    convertedScoringTypes[player.position][min.statType]
                  ]
                );
                return statNumber > Number.parseFloat(min.threshold);
              });
              const retObj = {};
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
            type: "b",
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
