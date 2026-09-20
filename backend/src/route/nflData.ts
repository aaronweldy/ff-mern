import { createHash } from "node:crypto";
import { defaultScoringSettings } from "../constants/league.js";
import { loadDefenseStatsSource } from "../utils/defenseStatsSource.js";
import { rankDefenseSample } from "../utils/defenseVsPosition.js";
import { instanceToPlain } from "class-transformer";
import { Router } from "express";
import { db } from "../config/firebase-config.js";
import { fetchPlayers } from "../utils/fetchRoutes.js";
import { NFLSchedule, RosteredPlayer } from "@ff-mern/ff-types";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/allPlayers/", async (_, res) => {
  const allPlayers = await db.collection("globalPlayers").doc("players").get();
  if (!allPlayers.exists) {
    fetchPlayers().then((players) => {
      const deconstructedPlayers = players.map((player) =>
        instanceToPlain(player)
      );
      db.collection("globalPlayers")
        .doc("players")
        .set({ players: deconstructedPlayers });
      res.status(200).send(players);
    });
  } else {
    res.status(200).send({ players: allPlayers.data().players });
  }
});

router.post("/syncPlayers/", requireAuth, async (_, res) => {
  try {
    const players = await fetchPlayers();
    const deconstructedPlayers = players.map((player) =>
      instanceToPlain(player)
    );
    await db
      .collection("globalPlayers")
      .doc("players")
      .set({ players: deconstructedPlayers });
    res.status(200).send({ players: deconstructedPlayers });
  } catch (error) {
    console.error("Error syncing players:", error);
    res.status(500).send({ error: "Failed to sync players" });
  }
});

router.post("/addPlayer/", requireAuth, async (req, res) => {
  try {
    const { fullName, team, position } = req.body;
    if (!fullName || !team || !position) {
      res.status(400).send({ error: "Missing required fields: fullName, team, position" });
      return;
    }

    const allPlayersDoc = await db.collection("globalPlayers").doc("players").get();
    const existingPlayers = allPlayersDoc.exists ? allPlayersDoc.data()?.players || [] : [];

    const newPlayer = new RosteredPlayer(fullName, team, position);
    const deconstructedPlayer = instanceToPlain(newPlayer);

    existingPlayers.push(deconstructedPlayer);

    await db
      .collection("globalPlayers")
      .doc("players")
      .set({ players: existingPlayers });

    res.status(200).send({ players: existingPlayers });
  } catch (error) {
    console.error("Error adding player:", error);
    res.status(500).send({ error: "Failed to add player" });
  }
});

router.get("/nflSchedule/", async (_, res) => {
  const schedule =
    await db.collection("nflSchedule").get();
  const resp: NFLSchedule = {}
  schedule.forEach((doc) => {
    resp[doc.id] = doc.data()
  })

  res.status(200).send(resp);
});

router.get("/nflDefenseStats/", async (req, res) => {
  try {
    const leagueId = req.query.leagueId;
    if (leagueId !== undefined && (typeof leagueId !== "string" || !leagueId || leagueId.includes("/"))) {
      res.status(400).send({ error: "Invalid league ID" });
      return;
    }
    let settings = defaultScoringSettings.Standard;
    if (typeof leagueId === "string") {
      const league = await db.collection("leagues").doc(leagueId).get();
      if (!league.exists) {
        res.status(404).send({ error: "League not found" });
        return;
      }
      settings = league.data().scoringSettings;
      if (!Array.isArray(settings)) throw new Error("Missing league scoring settings");
    }
    // Versioned and keyed by scoring rules so a failed refresh never serves
    // FantasyPros rankings or rankings calculated with different rules.
    const key = createHash("sha256").update(JSON.stringify(settings)).digest("hex");
    const reference = db.collection("nflverseDefenseRankings").doc(`v1-${key}`);
    const cached = (await reference.get()).data();
    if (cached && Date.now() - Date.parse(cached.metadata.fetchedAt) < 5 * 60 * 1000) {
      res.status(200).send(cached);
      return;
    }
    try {
      const source = await loadDefenseStatsSource();
      const ranked = rankDefenseSample(source.sample, settings);
      if (cached?.metadata?.season === source.sample.season &&
          Object.entries(cached.metadata.gamesPlayed as Record<string, number>).some(
            ([team, count]) => (ranked.metadata.gamesPlayed[team] || 0) < count
          )) {
        throw new Error("nflverse refresh lost previously included games");
      }
      const result = { ...ranked, metadata: { ...ranked.metadata, fetchedAt: source.fetchedAt, stale: false } };
      await reference.set(result);
      res.status(200).send(result);
    } catch (error) {
      console.error("Failed to refresh nflverse defense rankings:", error);
      if (cached) {
        res.status(200).send({ ...cached, metadata: { ...cached.metadata, stale: true } });
      } else {
        res.status(503).send({ error: "Matchup rankings are not available yet" });
      }
    }
  } catch (error) {
    console.error("Failed to load defense rankings:", error);
    res.status(500).send({ error: "Failed to load matchup rankings" });
  }
});

export default router;
