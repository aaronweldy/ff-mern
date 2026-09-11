/* eslint-disable no-mixed-spaces-and-tabs */
import { defaultScoringSettings } from "../constants/league.js";
import { Router } from "express";
import { v4 } from "uuid";
import admin, { db } from "../config/firebase-config.js";
import {
  League,
  ScoringError,
  Team,
  PlayerScoreData,
  CumulativePlayerScore,
  PlayerScoresResponse,
  CumulativePlayerScores,
  getCurrentSeason,
  DraftState,
} from "@ff-mern/ff-types";
import {
  fetchPlayers,
  getTeamsInLeague,
  scoreAllPlayers,
} from "../utils/fetchRoutes.js";
import { updateCumulativeStats } from "../utils/updateCumulativeStats.js";
import {
  resolveScoringLineup,
  fetchCompletedTeams,
} from "../utils/scoringResolution.js";
import {
  isLeagueCommissioner,
  requireAuth,
} from "../middleware/auth.js";
const router = Router();

type LeagueScoringDefault = "Standard" | "PPR";

const getSortedCumulativePlayerScores = (
  scores: CumulativePlayerScores
) =>
  Object.keys(scores)
    .sort((a, b) => scores[b].totalPointsInSeason - scores[a].totalPointsInSeason)
    .reduce((acc: CumulativePlayerScores, playerName: string) => {
      acc[playerName] = scores[playerName];
      return acc;
    }, {});

const getStoredLeagueScoringDocs = async (leagueId: string, year: number) => {
  const collection = db.collection("leagueScoringData");
  const documentRefs = Array.from({ length: 18 }, (_, index) =>
    collection.doc(`${year}${index + 1}${leagueId}`)
  );
  const snapshots = await db.getAll(...documentRefs);
  return snapshots.filter((doc) => doc.exists);
};

const getHistoricalCumulativePlayerScores = async (
  leagueId: string,
  year: number
): Promise<CumulativePlayerScores> => {
  const scoringDocs = await getStoredLeagueScoringDocs(leagueId, year);
  const scores: CumulativePlayerScores = {};

  scoringDocs.forEach((doc) => {
    const week = Number(doc.id.slice(4, -leagueId.length));
    if (!Number.isInteger(week) || week < 1 || week > 18) {
      return;
    }
    const playerData = doc.data().playerData as PlayerScoreData | undefined;
    if (!playerData) {
      return;
    }

    Object.entries(playerData).forEach(([sanitizedName, data]) => {
      const storedName = data.statistics?.Player;
      const playerName =
        typeof storedName === "string"
          ? storedName.replace(/\s*\([^)]*\)\s*$/, "").trim()
          : sanitizedName;
      const existingScore: CumulativePlayerScore = scores[playerName] || {
        position: data.position,
        team: data.team,
        totalPointsInSeason: 0,
        pointsByWeek: Array(18).fill(0),
      };
      existingScore.position = data.position;
      existingScore.team = data.team;
      existingScore.pointsByWeek[week - 1] = data.scoring.totalPoints;
      existingScore.totalPointsInSeason = existingScore.pointsByWeek.reduce(
        (total, points) => total + points,
        0
      );
      scores[playerName] = existingScore;
    });
  });

  return getSortedCumulativePlayerScores(scores);
};

const getAvailableCumulativeScoreYears = async (leagueId: string) => {
  const years = new Set<number>([getCurrentSeason()]);
  const documentRefs = await db
    .collection("leagueScoringData")
    .listDocuments();
  documentRefs.forEach((doc) => {
    if (!doc.id.endsWith(leagueId)) {
      return;
    }
    const year = Number(doc.id.slice(0, 4));
    if (Number.isInteger(year) && year >= 2000 && year <= getCurrentSeason()) {
      years.add(year);
    }
  });
  return [...years].sort((a, b) => b - a);
};

// ---- Public reads (no auth) ----

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
    const league = (await db.collection("leagues").doc(leagueId).get()).data();
    res.status(200).json({ league });
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

router.get("/:id/teams/", async (req, res) => {
  const leagueId = req.params["id"];
  try {
    const teams = await getTeamsInLeague(leagueId);
    res.status(200).json({ teams });
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

router.post("/create/", requireAuth, async (req, res) => {
  const { league, teams, logo, posInfo, scoring, numWeeks, numSuperflex } =
    req.body;
  if (typeof league !== "string" || league.trim() === "") {
    res.status(400).send({ error: "League name is required." });
    return;
  }
  if (!Array.isArray(teams)) {
    res.status(400).send({ error: "Teams must be an array." });
    return;
  }
  const validScoring = ["Standard", "PPR", "Custom"];
  if (typeof scoring !== "string" || !validScoring.includes(scoring)) {
    res
      .status(400)
      .send({ error: `Scoring must be one of: ${validScoring.join(", ")}.` });
    return;
  }
  const leagueId = v4();
  try {
    await db.collection("leagues").doc(leagueId).set({
      name: league,
      lineupSettings: posInfo,
      logo,
      numWeeks,
      numSuperflex,
      lastScoredWeek: 0,
    });
    const comms: string[] = [];
    for await (const team of teams) {
        const teamId = v4();
        try {
          const user = await admin.auth().getUserByEmail(team.ownerName);
          await db.collection("teams").doc(teamId).set({
            ...team,
            owner: user.uid,
            id: teamId,
            isCommissioner: team.isCommissioner || comms.includes(user.uid),
            league: leagueId,
            leagueLogo: logo,
          });
          if (team.isCommissioner) comms.push(user.uid);
        } catch (err) {
          console.log(err);
          await db.collection("teams").doc(teamId).set({
            ...team,
            name: team.name,
            owner: "default",
            ownerName: "default",
            id: teamId,
            isCommissioner: false,
            league: leagueId,
            leagueLogo: logo,
          });
        }
      }
    await db.collection("leagues").doc(leagueId).update({
      commissioners: comms,
      scoringSettings:
        scoring === "Custom"
          ? []
          : defaultScoringSettings[scoring as LeagueScoringDefault],
    });
    res.status(200).json({ id: leagueId });
  } catch (e) {
    console.log("POST /league/create/ failed", e);
    if (!res.headersSent) {
      res.status(500).send({ error: "Failed to create league." });
    }
  }
});

router.post("/:id/join/", requireAuth, async (req, res) => {
  const { id } = req.params;
  const uid = req.user!.uid;
  const tokenEmail = req.user!.email;
  const requestedOwner = req.body.owner as string | undefined;
  // Never trust a client-supplied owner email that differs from the token.
  if (requestedOwner && tokenEmail && requestedOwner !== tokenEmail) {
    res.status(403).send("Owner email does not match authenticated user.");
    return;
  }
  const ownerEmail = tokenEmail ?? requestedOwner;
  if (!ownerEmail) {
    res.status(400).send("Authenticated user has no email on record.");
    return;
  }
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
    if (tokenEmail) {
      // Identity already verified via ID token; no email lookup needed.
      await db
        .collection("teams")
        .doc(teamData!.id)
        .update({ owner: uid, ownerName: ownerEmail });
      const respUrl = `/league/${id}/team/${teamData!.id}/`;
      res.status(200).json({ url: respUrl });
      return;
    }
    admin
      .auth()
      .getUserByEmail(ownerEmail)
      .then(async (user) => {
        if (user.uid !== uid) {
          res.status(403).send("Invalid user.");
          return;
        }
        await db
          .collection("teams")
          .doc(teamData!.id)
          .update({ owner: user.uid, ownerName: ownerEmail });
        const respUrl = `/league/${id}/team/${teamData!.id}/`;
        res.status(200).json({ url: respUrl });
      })
      .catch((e) => {
        console.log(e);
        res.status(403).send("Invalid user.");
      });
  }
});

router.post("/:id/delete/", requireAuth, async (req, res) => {
  const { id } = req.params;
  // Ownership comes from the verified ID token, never the request body.
  const uid = req.user!.uid;
  const leagueDoc = await db.collection("leagues").doc(id).get();
  if (!(leagueDoc.data() as League).commissioners.includes(uid))
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

router.patch(
  "/:leagueId/updateScoringSettings/",
  requireAuth,
  async (req, res) => {
    const { settings } = req.body;
    const { leagueId } = req.params;
    if (!(await isLeagueCommissioner(leagueId, req.user!.uid))) {
      res.status(403).send("Only commissioners may update scoring settings.");
      return;
    }
    const leagueRef = db.collection("leagues").doc(leagueId);
    leagueRef
      .update({ scoringSettings: settings })
      .then(() => {
        return leagueRef.get();
      })
      .then((updatedLeague) => {
        res.status(200).send({ league: updatedLeague.data() as League });
      });
  }
);

router.patch("/:leagueId/update/", requireAuth, async (req, res) => {
  const { leagueId } = req.params;
  if (!(await isLeagueCommissioner(leagueId, req.user!.uid))) {
    res.status(403).send("Only commissioners may update the league.");
    return;
  }
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
        });
    } catch {
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

router.post("/:leagueId/runScores/", requireAuth, async (req, res, next) => {
  try {
    const { week } = req.body;
    const { leagueId } = req.params;
    if (!(await isLeagueCommissioner(leagueId, req.user!.uid))) {
      res.status(403).send("Only commissioners may run scores.");
      return;
    }
    const leagueRef = db.collection("leagues").doc(leagueId);
    const league = (await leagueRef.get()).data() as League;
    if (
      !league ||
      !Number.isInteger(week) ||
      week < 1 ||
      week > league.numWeeks
    ) {
      res.status(400).send("Week is out of range");
      return;
    }
    const data = await scoreAllPlayers(league, leagueId, week, false);
    if (!Object.keys(data).length) {
      res.status(400).send("No stats exist for week.");
      return;
    }
    if (
      Object.values(data).some(
        (player) => !Number.isFinite(player.scoring.totalPoints)
      )
    ) {
      throw new Error(
        "Scoring data contains invalid points; scores were not saved."
      );
    }
    // A failed status lookup aborts the run before any writes.
    const completed = await fetchCompletedTeams(getCurrentSeason(), week);
    const result = await db.runTransaction(async (transaction) => {
      const leagueSnapshot = await transaction.get(leagueRef);
      if (JSON.stringify(leagueSnapshot.data()?.scoringSettings) !== JSON.stringify(league.scoringSettings)) {
        throw new Error("Scoring settings changed during this run; please calculate scores again.");
      }
      const snapshot = await transaction.get(
        db.collection("teams").where("league", "==", leagueId)
      );
      await updateCumulativeStats(leagueId, week, data, transaction);
      const teams: Team[] = [];
      const errors: ScoringError[] = [];
      for (const doc of snapshot.docs) {
        const team = doc.data() as Team;
        const resolved = resolveScoringLineup(team, week, data, completed);
        errors.push(...resolved.errors);
        team.weekInfo[week] = {
          ...team.weekInfo[week],
          weekScore: resolved.weekScore,
          scoringLineup: resolved.lineup,
          substitutions: resolved.substitutions,
        };
        transaction.update(doc.ref, { weekInfo: team.weekInfo });
        teams.push(team);
      }
      transaction.set(
        db
          .collection("leagueScoringData")
          .doc(`${getCurrentSeason()}${week}${leagueId}`),
        { playerData: data }
      );
      transaction.update(leagueRef, {
        lastScoredWeek: Math.max(
          week,
          leagueSnapshot.data()?.lastScoredWeek || 0
        ),
      });
      return { teams, errors };
    });
    res.status(200).json({ ...result, data });
    console.log(`successful runScores for league ${leagueId}`);
  } catch (error) {
    next(error);
  }
});

router.post("/:leagueId/playerScores/", requireAuth, async (req, res) => {
  const { leagueId } = req.params;
  const { players, week }: { players: string[]; week: number } = req.body;
  const teams = await getTeamsInLeague(leagueId);
  const league = (
    await db.collection("leagues").doc(leagueId).get()
  ).data() as League;
  if (!league) {
    res.status(404).send("League not found");
    return;
  }

  if (week > league.lastScoredWeek) {
    const resp: PlayerScoresResponse = { teams, league, players: {} };
    res.status(200).send(resp);
    return;
  }
  const yearWeek = getCurrentSeason() + week.toString();
  const data = (
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

router.get("/:id/cumulativePlayerScores/years/", async (req, res) => {
  const { id } = req.params;
  const years = await getAvailableCumulativeScoreYears(id);
  res.status(200).send({ years });
});

router.get("/:id/cumulativePlayerScores/", async (req, res) => {
  const { id } = req.params;
  const requestedYear =
    typeof req.query.year === "string" ? Number(req.query.year) : undefined;
  if (
    requestedYear !== undefined &&
    (!Number.isInteger(requestedYear) ||
      requestedYear < 2000 ||
      requestedYear > getCurrentSeason())
  ) {
    res.status(400).send("Invalid scoring year");
    return;
  }

  if (requestedYear !== undefined && requestedYear !== getCurrentSeason()) {
    const historicalScores = await getHistoricalCumulativePlayerScores(
      id,
      requestedYear
    );
    res.status(200).send(historicalScores);
    return;
  }

  const cumulativeData = await db
    .collection("cumulativePlayerScores")
    .doc(id)
    .get();
  if (!cumulativeData.exists) {
    const curPlayers = await fetchPlayers();
    const initData = curPlayers.reduce(
      (acc: CumulativePlayerScores, player) => {
        acc[player.fullName] = {
          totalPointsInSeason: 0,
          team: player.team,
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
  res.status(200).send(getSortedCumulativePlayerScores(retData));
});

router.get("/:leagueId/:userId/isCommissioner", (req, res) => {
  const { leagueId, userId } = req.params;
  db.collection("leagues")
    .doc(leagueId)
    .get()
    .then((league) => {
      if (!league.exists) {
        res.status(200).send({ isCommissioner: false });
        return;
      }
      const { commissioners } = league.data();
      if (!commissioners.includes(userId)) {
        res.status(200).send({ isCommissioner: false });
        return;
      }
      res.status(200).send({ isCommissioner: true });
    });
});

router.patch("/:leagueId/resetAllRosters/", requireAuth, async (req, res) => {
  const { leagueId } = req.params;
  if (!(await isLeagueCommissioner(leagueId, req.user!.uid))) {
    res.status(403).send("Only commissioners may reset rosters.");
    return;
  }
  const league = (await db.collection("leagues").doc(leagueId).get()).data() as League;
  const teams = await getTeamsInLeague(leagueId);
  await db.collection("cumulativePlayerScores").doc(leagueId).delete();
  teams.forEach(async (team) => {
    team.rosteredPlayers = [];
    team.weekInfo = [
      ...Array(league.numWeeks + 1).fill({
        weekScore: 0,
        addedPoints: 0,
        finalizedLineup: {},
      }),
    ];
    await db.collection("teams").doc(team.id).update({ ...team });
  });
  res.status(200).send({ teams });
});

router.get("/:id/draft/", async (req, res) => {
  const { id } = req.params;
  const draftForLeague = await db
    .collection("drafts")
    .where("leagueId", "==", id)
    .get();
  if (draftForLeague.empty) {
    res.status(200).json({ draft: null });
    return;
  }
  const draft = draftForLeague.docs[0].data() as DraftState;
  res.status(200).json({ draft: draft });
});

export default router;
