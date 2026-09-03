import { Router } from "express";
import express from "express";
import env from "dotenv";
import { db } from "../config/firebase-config.js";
import { getCurrentSeason, Team, Trade } from "@ff-mern/ff-types";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

env.config();

// Public reads
router.get("/:id/leagues/", async (req, res) => {
  const teams: Team[] = [];
  const { id } = req.params;
  db.collection("teams")
    .where("owner", "==", id)
    .get()
    .then(async (snapshot) => {
      snapshot.forEach((data) => {
        teams.push(data.data() as Team);
      });
      const resp = { teams, url: "" };
      const urlDoc = await db.collection("users").doc(id).get();
      if (urlDoc.exists) {
        resp.url = urlDoc.data()!.url;
      }
      res.json(resp);
    });
});

router.get("/:id/trades/", async (req, res) => {
  const response: Trade[] = [];
  const userProposed: Record<string, boolean> = {};
  const { id } = req.params;
  const teamsForUser = await db
    .collection("teams")
    .where("owner", "==", id)
    .get()
    .then(async (snapshot) => {
      const teamIds: string[] = [];
      snapshot.forEach((data) => {
        teamIds.push((data.data() as Team).id);
      });
      return teamIds;
    });
  for (const teamId of teamsForUser) {
    const trades = await db
      .collection("trades")
      .where("teamsInvolved", "array-contains", teamId)
      .where("season", "==", getCurrentSeason())
      .orderBy("dateProposed", "desc")
      .get();
    trades.forEach((trade) => {
      const tradeData = trade.data() as Trade;
      response.push(tradeData);
      if (tradeData.teamsInvolved[0] === teamId) {
        userProposed[tradeData.id] = true;
      }
    });
  }
  res.status(200).send({ trades: response, userProposed });
});

// Photo upload allows a larger body than the 1mb global default.
router.post(
  "/:id/updatePhoto",
  express.json({ limit: "10mb" }),
  requireAuth,
  (req, res) => {
    const { id } = req.params;
    // Users may only update their own photo; never trust a client-supplied id.
    if (!req.user || req.user.uid !== id) {
      res.status(403).send({ error: "Cannot update another user's photo" });
      return;
    }
    const { url } = req.body;
    db.collection("users")
      .doc(id)
      .set({ url })
      .then(() => res.status(200).send());
  }
);

export default router;
