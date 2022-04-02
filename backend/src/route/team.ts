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

router.post("/updateTeams/", (req, res) => {
  const { teams } = req.body;
  for (const team of teams) {
    db.collection("teams")
      .doc(team.id)
      .update({ ...team });
  }
  res.status(200).send({ teams });
});

router.post("/:id/updateSingleTeamInfo/", (req, res) => {
  const { url, name } = req.body;
  try {
    const doc = db.collection("teams").doc(req.params.id);
    doc.update({ logo: url, name }).then(async () => {
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
