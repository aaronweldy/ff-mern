var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
/* eslint-disable no-mixed-spaces-and-tabs */
import { defaultScoringSettings } from "../constants/league.js";
import { Router } from "express";
import { v4 } from "uuid";
import admin, { db } from "../config/firebase-config.js";
import { playerTeamIsNflAbbreviation, getCurrentSeason, } from "@ff-mern/ff-types";
import { fetchPlayers, getTeamsInLeague, scoreAllPlayers, } from "../utils/fetchRoutes.js";
import { updateCumulativeStats } from "../utils/updateCumulativeStats.js";
import { handleKickerBackupResolution, handleNonKickerBackupResolution, } from "../utils/backupResolution.js";
const router = Router();
router.get("/find/:query/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.params["query"];
    const startString = query.slice(0, 3);
    const cursor = yield db
        .collection("leagues")
        .where("name", ">=", startString)
        .where("name", "<=", startString + "\uf8ff")
        .get();
    const foundLeagues = {};
    cursor.forEach((doc) => (foundLeagues[doc.id] = doc.data()));
    res.status(200).send(foundLeagues);
}));
router.get("/:id/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const leagueId = req.params["id"];
    try {
        const league = (yield db.collection("leagues").doc(leagueId).get()).data();
        res.status(200).json({ league });
    }
    catch (e) {
        console.log(e);
        res.status(500).send();
    }
}));
router.get("/:id/teams/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const leagueId = req.params["id"];
    try {
        const teams = yield getTeamsInLeague(leagueId);
        res.status(200).json({ teams });
    }
    catch (e) {
        console.log(e);
        res.status(500).send();
    }
}));
router.post("/create/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { league, teams, logo, posInfo, scoring, numWeeks, numSuperflex } = req.body;
    const leagueId = v4();
    db.collection("leagues")
        .doc(leagueId)
        .set({
        name: league,
        lineupSettings: posInfo,
        logo,
        numWeeks,
        numSuperflex,
        lastScoredWeek: 0,
    })
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        var e_1, _a;
        let comms = [];
        try {
            for (var teams_1 = __asyncValues(teams), teams_1_1; teams_1_1 = yield teams_1.next(), !teams_1_1.done;) {
                const team = teams_1_1.value;
                const teamId = v4();
                yield admin
                    .auth()
                    .getUserByEmail(team.ownerName)
                    .then((user) => __awaiter(void 0, void 0, void 0, function* () {
                    db.collection("teams")
                        .doc(teamId)
                        .set(Object.assign(Object.assign({}, team), { owner: user.uid, id: teamId, isCommissioner: team.isCommissioner || comms.includes(user.uid), league: leagueId, leagueLogo: logo }));
                    if (team.isCommissioner)
                        comms.push(user.uid);
                }))
                    .catch((err) => __awaiter(void 0, void 0, void 0, function* () {
                    console.log(err);
                    db.collection("teams")
                        .doc(teamId)
                        .set(Object.assign(Object.assign({}, team), { name: team.name, owner: "default", ownerName: "default", id: teamId, isCommissioner: false, league: leagueId, leagueLogo: logo }));
                }));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (teams_1_1 && !teams_1_1.done && (_a = teams_1.return)) yield _a.call(teams_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        db.collection("leagues")
            .doc(leagueId)
            .update({
            commissioners: comms,
            scoringSettings: scoring === "Custom"
                ? {}
                : defaultScoringSettings[scoring],
        })
            .then(() => {
            res.status(200).json({ id: leagueId });
        });
    }));
}));
router.post("/:id/join/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { owner } = req.body;
    const firstValidTeam = yield db
        .collection("teams")
        .where("league", "==", id)
        .where("owner", "==", "default")
        .limit(1)
        .get();
    let teamData = null;
    if (firstValidTeam.empty) {
        res.status(409).send({ message: "League is full" });
    }
    else {
        firstValidTeam.forEach((doc) => {
            console.log(doc.data());
            teamData = doc.data();
        });
        console.log(firstValidTeam.size);
        admin
            .auth()
            .getUserByEmail(owner)
            .then((user) => __awaiter(void 0, void 0, void 0, function* () {
            yield db
                .collection("teams")
                .doc(teamData.id)
                .update({ owner: user.uid, ownerName: owner });
            const respUrl = `/league/${id}/team/${teamData.id}/`;
            res.status(200).json({ url: respUrl });
        }))
            .catch((e) => {
            console.log(e);
            res.status(403).send("Invalid user.");
        });
    }
}));
router.post("/:id/delete/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { user } = req.body;
    const leagueDoc = yield db.collection("leagues").doc(id).get();
    if (!leagueDoc.data().commissioners.includes(user))
        return res
            .status(403)
            .send("User is not a commissioner, and is therefore unauthorized to delete this league.");
    yield db
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
        .then(() => res.status(200).send({ message: "League deleted successfully" }));
}));
router.get("/:leagueId/teams/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
router.patch("/:leagueId/updateScoringSettings/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { settings } = req.body;
    const { leagueId } = req.params;
    const leagueRef = db.collection("leagues").doc(leagueId);
    leagueRef
        .update({ scoringSettings: settings })
        .then(() => {
        return leagueRef.get();
    })
        .then((updatedLeague) => {
        res.status(200).send({ league: updatedLeague.data() });
    });
}));
router.patch("/:leagueId/update/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { leagueId } = req.params;
    const { league, teams, deletedTeams, } = req.body;
    yield db
        .collection("leagues")
        .doc(leagueId)
        .update(Object.assign({}, league));
    for (const team of teams) {
        try {
            db.collection("teams")
                .doc(team.id)
                .update(Object.assign(Object.assign({}, team), { leagueName: league.name, leagueLogo: league.logo }));
        }
        catch (e) {
            const teamId = v4();
            yield admin
                .auth()
                .getUserByEmail(team.ownerName)
                .then((user) => __awaiter(void 0, void 0, void 0, function* () {
                db.collection("teams")
                    .doc(teamId)
                    .set({
                    name: team.name,
                    owner: user.uid,
                    ownerName: user.email,
                    id: teamId,
                    isCommissioner: team.isCommissioner || league.commissioners.includes(user.uid),
                    league: leagueId,
                    leagueName: league.name,
                    leagueLogo: league.logo,
                    logo: "/football.jfif",
                    players: [],
                    weekScores: [...Array(18).fill(0)],
                    addedPoints: [],
                });
            }))
                .catch(() => __awaiter(void 0, void 0, void 0, function* () {
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
            }));
        }
    }
    for (const team of deletedTeams) {
        yield db.collection("teams").doc(team.id).delete();
    }
    res.status(200).send("Updated all league settings");
}));
router.post("/:leagueId/runScores/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { week } = req.body;
    const { leagueId } = req.params;
    const teams = yield getTeamsInLeague(leagueId);
    const league = (yield db.collection("leagues").doc(leagueId).get()).data();
    if (week > league.numWeeks) {
        res.status(400).send("Week is out of range");
        return;
    }
    const errors = [];
    const data = yield scoreAllPlayers(league, leagueId, week);
    teams.forEach((team) => __awaiter(void 0, void 0, void 0, function* () {
        team.weekInfo[week].weekScore = 0;
        Object.values(team.weekInfo[week].finalizedLineup).forEach((players) => {
            players
                .filter((player) => player.fullName !== "")
                .forEach((player) => {
                let sanitizedPlayerName = player.sanitizedName;
                if (!(sanitizedPlayerName in data)) {
                    return;
                }
                if (player.position !== "K") {
                    sanitizedPlayerName = handleNonKickerBackupResolution(team, player, week, parseInt(data[sanitizedPlayerName].statistics.snaps || "0"));
                }
                else {
                    sanitizedPlayerName = handleKickerBackupResolution(team, player, week, data);
                }
                if (!playerTeamIsNflAbbreviation(player.team)) {
                    player.team = data[player.sanitizedName].team;
                }
                const playerData = data[sanitizedPlayerName];
                if (player.lineup !== "bench") {
                    team.weekInfo[week].weekScore += playerData.scoring.totalPoints;
                }
            });
        });
        yield db.collection("teams").doc(team.id).update(team);
    }));
    yield db.collection("leagues").doc(leagueId).update({ lastScoredWeek: week });
    res.status(200).json({ teams, errors, data });
    console.log(`successful runScores for league ${leagueId}`);
    updateCumulativeStats(leagueId, week, data);
}));
router.post("/:leagueId/playerScores/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { leagueId } = req.params;
    const { players, week } = req.body;
    const teams = yield getTeamsInLeague(leagueId);
    const league = (yield db.collection("leagues").doc(leagueId).get()).data();
    if (week > league.lastScoredWeek) {
        const resp = { teams, league, players: {} };
        res.status(200).send(resp);
        return;
    }
    const yearWeek = getCurrentSeason() + week.toString();
    let data = (yield db
        .collection("leagueScoringData")
        .doc(yearWeek + leagueId)
        .get()).data();
    if (!data) {
        const resp = { teams, league, players: {} };
        res.status(200).send(resp);
        return;
    }
    if (!players) {
        const resp = {
            teams,
            league,
            players: data.playerData,
        };
        res.status(200).send(resp);
        return;
    }
    const resp = {
        teams,
        league,
        players: data.playerData,
    };
    res.status(200).send(resp);
}));
router.get("/:id/cumulativePlayerScores/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const cumulativeData = yield db
        .collection("cumulativePlayerScores")
        .doc(id)
        .get();
    if (!cumulativeData.exists) {
        const curPlayers = yield fetchPlayers();
        const initData = curPlayers.reduce((acc, player) => {
            acc[player.fullName] = {
                totalPointsInSeason: 0,
                team: player.team,
                pointsByWeek: Array(18).fill(0),
                position: player.position,
            };
            return acc;
        }, {});
        res.status(200).send(initData);
        db.collection("cumulativePlayerScores").doc(id).set(initData);
        return;
    }
    const retData = cumulativeData.data();
    const sortedData = Object.keys(retData)
        .sort((a, b) => {
        return retData[b].totalPointsInSeason - retData[a].totalPointsInSeason;
    })
        .reduce((acc, i) => {
        acc[i] = retData[i];
        return acc;
    }, {});
    res.status(200).send(sortedData);
}));
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
router.patch("/:leagueId/resetAllRosters/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { leagueId } = req.params;
    const teams = yield getTeamsInLeague(leagueId);
    teams.forEach((team) => __awaiter(void 0, void 0, void 0, function* () {
        team.rosteredPlayers = [];
        yield db.collection("teams").doc(team.id).update(team);
    }));
    res.status(200).send({ teams });
}));
router.get("/:id/draft/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const draftForLeague = yield db
        .collection("drafts")
        .where("leagueId", "==", id)
        .get();
    if (draftForLeague.empty) {
        res.status(200).json({ draft: null });
        return;
    }
    const draft = draftForLeague.docs[0].data();
    res.status(200).json({ draft: draft });
}));
export default router;
//# sourceMappingURL=league.js.map