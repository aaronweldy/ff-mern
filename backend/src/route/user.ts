import { Router } from "express";
import env from "dotenv";
import { db } from "../config/firebase-config.js";
import { Team } from "ff-mern/src/ff-types/Team";
const router = Router();

env.config();

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
      if (urlDoc.exists) resp.url = urlDoc.data()!.url;
      res.json(resp).send();
    });
});

router.post("/:id/updatePhoto", (req, res) => {
  const { id } = req.params;
  const { url } = req.body;
  db.collection("users")
    .doc(id)
    .set({ url })
    .then(() => res.status(200).send());
});

export default router;
