var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from "express";
import admin, { db } from "../config/firebase-config.js";
const router = Router();
router.post("/validateTeams/", (req, res) => {
    const { teams } = req.body;
    teams.forEach((team) => {
        admin
            .auth()
            .getUserByEmail(team.ownerName)
            .then((user) => __awaiter(void 0, void 0, void 0, function* () {
            db.collection("teams")
                .doc(team.id)
                .update(Object.assign(Object.assign({}, team), { owner: user.uid }));
        }))
            .catch(() => __awaiter(void 0, void 0, void 0, function* () {
            db.collection("teams")
                .doc(team.id)
                .update(Object.assign({ owner: "default" }, team));
        }));
    });
    res.status(200).send({ teams });
});
router.post("/updateTeams/", (req, res) => {
    const { teams } = req.body;
    for (const team of teams) {
        db.collection("teams")
            .doc(team.id)
            .update(Object.assign({}, team));
    }
    res.status(200).send({ teams });
});
router.post("/:id/updateSingleTeamInfo/", (req, res) => {
    const { url, name } = req.body;
    try {
        const doc = db.collection("teams").doc(req.params.id);
        doc.update({ logo: url, name }).then(() => __awaiter(void 0, void 0, void 0, function* () {
            const teamData = (yield doc.get()).data();
            res.status(200).send({ team: teamData });
        }));
    }
    catch (e) {
        console.log(e);
        res.status(500).send();
    }
});
router.get("/:id/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const team = yield db.collection("teams").doc(req.params.id).get();
    res.status(200).json({
        team: team.data(),
    });
}));
export default router;
//# sourceMappingURL=team.js.map