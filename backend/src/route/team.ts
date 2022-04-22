import { Team } from "@ff-mern/ff-types";
import { Router } from "express";
import admin, { db } from "../config/firebase-config.js";

const router = Router();

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

router.put("/updateSingleTeam/", (req, res) => {
  const { team } = req.body;
  try {
    const doc = db.collection("teams").doc(team.id);
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

export default router;
