var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { FinalizedPlayer, setPlayerName, } from "@ff-mern/ff-types";
import { Router } from "express";
import admin, { db } from "../config/firebase-config.js";
import { fetchPlayerProjections } from "../utils/fetchRoutes.js";
import { findLineupChanges } from "../utils/findLineupChanges.js";
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
                .update(Object.assign(Object.assign({}, team), { lastUpdated: new Date().toLocaleString(), owner: user.uid }));
        }))
            .catch(() => __awaiter(void 0, void 0, void 0, function* () {
            db.collection("teams")
                .doc(team.id)
                .update(Object.assign({ owner: "default", lastUpdated: new Date().toLocaleString() }, team));
        }));
    });
    res.status(200).send({ teams });
});
router.post("/updateTeams/", (req, res) => {
    const { teams } = req.body;
    for (const team of teams) {
        db.collection("teams")
            .doc(team.id)
            .update(Object.assign(Object.assign({}, team), { lastUpdated: new Date().toLocaleString() }));
    }
    res.status(200).send({ teams });
});
router.put("/updateSingleTeam/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { team } = req.body;
    console.log("Updating team: " + team.name);
    try {
        const doc = db.collection("teams").doc(team.id);
        const prevData = (yield doc.get()).data();
        const lineupDiff = findLineupChanges(prevData.weekInfo, team.weekInfo);
        for (const diff of lineupDiff) {
            console.log("Changes: ");
            console.log("Week: " + diff.week + ", "
                + ((_b = (_a = diff === null || diff === void 0 ? void 0 : diff.oldPlayer) === null || _a === void 0 ? void 0 : _a.fullName) !== null && _b !== void 0 ? _b : "(Empty)") + " -> " + ((_d = (_c = diff === null || diff === void 0 ? void 0 : diff.newPlayer) === null || _c === void 0 ? void 0 : _c.fullName) !== null && _d !== void 0 ? _d : "(Empty)")
                + " at position " + diff.position);
        }
        doc
            .set(Object.assign(Object.assign({}, team), { lastUpdated: new Date().toLocaleString() }))
            .then(() => __awaiter(void 0, void 0, void 0, function* () {
            const teamData = (yield doc.get()).data();
            res.status(200).send({ team: teamData });
        }));
    }
    catch (e) {
        console.log(e);
        res.status(500).send();
    }
}));
router.get("/:id/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const team = yield db.collection("teams").doc(req.params.id).get();
    res.status(200).json({
        team: team.data(),
    });
}));
router.post("/setLineupFromProjection/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { team, week, type, lineupSettings, } = req.body;
    console.log(team.name);
    const weekNum = parseInt(week);
    if (type === "LastWeek" && parseInt(week) > 1) {
        team.weekInfo[weekNum].finalizedLineup =
            team.weekInfo[weekNum - 1].finalizedLineup;
        yield db.collection("teams").doc(team.id).set(team);
        res.status(200).send({ team });
        return;
    }
    else if (type === "LastWeek") {
        res.status(401).send();
        return;
    }
    const projections = yield fetchPlayerProjections(week);
    const newLineup = Object.assign({}, team.weekInfo[week].finalizedLineup);
    const usedPlayers = new Set();
    for (const pos of Object.keys(team.weekInfo[weekNum].finalizedLineup)) {
        if (pos === "bench") {
            continue;
        }
        const playerOptions = team.rosteredPlayers
            .filter((player) => pos.indexOf(player.position) > -1 &&
            !usedPlayers.has(player.sanitizedName))
            .sort((a, b) => (projections[b.sanitizedName] || 0) -
            (projections[a.sanitizedName] || 0));
        for (const player of playerOptions) {
            console.log(pos, player.fullName, projections[player.sanitizedName]);
        }
        for (let i = 0; i < newLineup[pos].length; i++) {
            if (i < playerOptions.length) {
                usedPlayers.add(playerOptions[i].sanitizedName);
                setPlayerName(newLineup[pos][i], playerOptions[i].fullName);
                newLineup[pos][i].team = playerOptions[i].team;
            }
            else {
                setPlayerName(newLineup[pos][i], "");
                newLineup[pos][i].team = "None";
            }
        }
    }
    newLineup.bench = team.rosteredPlayers
        .filter((player) => !usedPlayers.has(player.sanitizedName))
        .map((player) => {
        const newPlayer = new FinalizedPlayer(player.fullName, player.position, player.team, "bench");
        return JSON.parse(JSON.stringify(newPlayer));
    });
    team.weekInfo[weekNum].finalizedLineup = newLineup;
    yield db.collection("teams").doc(team.id).set(team);
    res.status(200).send({ team });
}));
export default router;
//# sourceMappingURL=team.js.map