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
import { convertedScoringTypes, RosteredPlayer, sanitizePlayerName, getCurrentSeason, AbbreviationToFullTeam, } from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
import fetch from "node-fetch";
import { load } from "cheerio";
// @ts-ignore
import { get } from './tableScraper.js';
export const positions = ["qb", "rb", "wr", "te", "k"];
export const longPositions = [
    "Quarterbacks",
    "Running Backs",
    "Wide Receivers",
    "Tight Ends",
];
const sliceTeamFromName = (name) => {
    const lastSpace = name.lastIndexOf(" ");
    return name.substring(0, lastSpace);
};
export const fetchPlayerProjections = (week) => __awaiter(void 0, void 0, void 0, function* () {
    const season = getCurrentSeason();
    const check = yield db
        .collection("playerProjections")
        .doc(`${season}${week}`)
        .get();
    if (check.exists) {
        return check.data();
    }
    let scrapedProjections = {};
    for (const pos of positions) {
        const url = `https://www.fantasypros.com/nfl/projections/${pos}.php?week=${week}`;
        const tableData = yield get(url);
        for (const player of tableData[0]) {
            if (player.Player !== "") {
                scrapedProjections[sliceTeamFromName(sanitizePlayerName(player.Player))] = parseFloat(player.FPTS);
            }
        }
    }
    yield db
        .collection("playerProjections")
        .doc(`${season}week${week}`)
        .set(scrapedProjections);
    return scrapedProjections;
});
export const fetchPlayers = () => {
    return new Promise((resolve, _) => __awaiter(void 0, void 0, void 0, function* () {
        let players = [];
        const kickerUrl = "https://www.fantasypros.com/nfl/projections/k.php";
        const kickerData = yield get(kickerUrl);
        for (const player of kickerData[0]) {
            const lastSpaceIndex = player["Player"].lastIndexOf(" ");
            const name = player["Player"].slice(0, lastSpaceIndex);
            const team = player["Player"].slice(lastSpaceIndex + 1);
            players.push(new RosteredPlayer(name, team, "K"));
        }
        for (const [abbrevTeam, fullTeam] of Object.entries(AbbreviationToFullTeam)) {
            const url = `https://www.fantasypros.com/nfl/depth-chart/${fullTeam
                .split(" ")
                .join("-")}.php`;
            const tableData = yield get(url);
            for (let i = 0; i < longPositions.length; ++i) {
                for (const player of tableData[i]) {
                    players.push(new RosteredPlayer(player[longPositions[i]], abbrevTeam, positions[i].toUpperCase()));
                }
            }
        }
        resolve(players);
    }));
};
export const fetchLatestFantasyProsScoredWeek = (targetWeek) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (yield fetch(`https://www.fantasypros.com/nfl/stats/qb.php?week=${targetWeek}&range=week`)).text();
    const $ = load(data);
    return [parseInt($(".select-links").eq(0).find(":selected").text()), parseInt($("#single-week").attr("value"))];
});
export const fetchWeeklySnapCount = (week) => __awaiter(void 0, void 0, void 0, function* () {
    const year = getCurrentSeason();
    console.log(year);
    let curStats = (yield db
        .collection("weekStats")
        .doc(year + "week" + week)
        .get()).data().playerMap;
    for (const pos of positions.slice(0, 4)) {
        const url = `https://www.fantasypros.com/nfl/reports/snap-counts/${pos}.php`;
        const tableData = yield get(url);
        const players = tableData[0];
        for (const player of players) {
            if (player.Player !== "") {
                const playerName = sanitizePlayerName(player.Player);
                const playerStats = curStats[playerName];
                if (playerStats) {
                    playerStats.snaps = player[week];
                }
            }
        }
    }
    db.collection("weekStats")
        .doc(year + "week" + week)
        .update({ playerMap: curStats });
    return curStats;
});
export const fetchWeeklyStats = (week) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    const year = getCurrentSeason();
    console.log("season is: ", year);
    const [season, latestScoredWeek] = yield fetchLatestFantasyProsScoredWeek(week.toString());
    console.log("Parsed season: " + season);
    let usableStats = {};
    if (latestScoredWeek < week || season < year) {
        console.log("No stats for " + season + " week " + week + " available");
        return usableStats;
    }
    try {
        for (var _d = true, positions_1 = __asyncValues(positions), positions_1_1; positions_1_1 = yield positions_1.next(), _a = positions_1_1.done, !_a;) {
            _c = positions_1_1.value;
            _d = false;
            try {
                const pos = _c;
                const url = `https://www.fantasypros.com/nfl/stats/${pos}.php?year=${year}&week=${week}&range=week`;
                const table = yield get(url);
                for (const player of table[0]) {
                    const hashedName = sanitizePlayerName(player["Player"]);
                    if (hashedName) {
                        const team = hashedName
                            .slice(hashedName.indexOf("(") + 1, hashedName.indexOf(")"))
                            .toUpperCase();
                        usableStats[sanitizePlayerName(hashedName.slice(0, hashedName.indexOf("(") - 1))] =
                            pos === "qb"
                                ? Object.assign(Object.assign({}, player), { team, position: pos, PCT: Number.parseFloat(player["PCT"]).toFixed(2).toString(), "Y/A": Number.parseFloat(player["Y/A"]).toFixed(2).toString() || "0", "Y/A_2": (Number.parseFloat(player["YDS_2"]) /
                                        (Number.parseFloat(player["ATT_2"]) || 1))
                                        .toFixed(2)
                                        .toString(), "Y/CMP": (Number.parseFloat(player["YDS"]) /
                                        (Number.parseFloat(player["CMP"]) || 1))
                                        .toFixed(2)
                                        .toString() }) : Object.assign(Object.assign({}, player), { team, position: pos, PCT: "0", "Y/A": player["Y/A"] || "0", "Y/CMP": "0" });
                    }
                }
            }
            finally {
                _d = true;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = positions_1.return)) yield _b.call(positions_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    yield db
        .collection("weekStats")
        .doc(year + "week" + week)
        .set({ playerMap: usableStats });
    return usableStats;
});
export const scoreAllPlayers = (league, leagueId, week) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {};
    const statsAtt = yield fetchWeeklyStats(week);
    if (Object.keys(statsAtt).length === 0) {
        return data;
    }
    const stats = yield fetchWeeklySnapCount(week.toString());
    const players = Object.values(stats).map((player) => new RosteredPlayer(player.Player.slice(0, player.Player.indexOf("(") - 1), player.team, player.position.toUpperCase()));
    players.forEach((player) => {
        const catPoints = league.scoringSettings
            .filter((set) => set.position.indexOf(player.position) >= 0)
            .map((category) => {
            const cat = category["category"];
            const hashVal = cat.qualifier === "between"
                ? `${cat.qualifier}|${cat.thresholdMax}${cat.thresholdMin}|${cat.statType}`
                : `${cat.qualifier}|${cat.threshold}|${cat.statType}`;
            let points = 0;
            try {
                const statNumber = Number.parseFloat(stats[player.sanitizedName][convertedScoringTypes[player.position][cat.statType]]);
                if (isNaN(statNumber))
                    return { hashVal: 0 };
                switch (cat.qualifier) {
                    case "per":
                        //console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
                        points = (statNumber / cat.threshold) * category.points;
                        break;
                    case "greater than":
                        if (statNumber >= cat.threshold)
                            points = category.points;
                        break;
                    case "between":
                        if (statNumber >= (cat.thresholdMin || Infinity) &&
                            statNumber <= (cat.thresholdMax || -Infinity))
                            points = category.points;
                        break;
                }
                const successMins = category.minimums.filter((min) => {
                    const statNumber = Number.parseFloat(stats[player.sanitizedName][convertedScoringTypes[player.position][min.statType]]);
                    return statNumber >= min.threshold;
                });
                let retObj = {};
                retObj[hashVal] =
                    successMins.length === category.minimums.length ? points : 0;
                return retObj;
            }
            catch (error) {
                console.log(`Error finding stats for player ${player.fullName}, ${player.position}`);
                return { hashVal: 0 };
            }
        });
        data[player.sanitizedName] = {
            team: stats[player.sanitizedName].team,
            position: player.position,
            scoring: {
                totalPoints: Number.parseFloat(catPoints
                    .reduce((acc, i) => acc + Object.values(i)[0], 0)
                    .toPrecision(4)),
                categories: Object.assign({}, ...catPoints),
            },
            statistics: stats[player.sanitizedName],
        };
    });
    const yearWeek = getCurrentSeason() + week.toString();
    yield db
        .collection("leagueScoringData")
        .doc(yearWeek + leagueId)
        .set({ playerData: data });
    return data;
});
export const getTeamsInLeague = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db
        .collection("teams")
        .where("league", "==", id)
        .get()
        .then((teamSnapshot) => {
        const teams = [];
        teamSnapshot.forEach((teamData) => {
            teams.push(teamData.data());
        });
        return teams;
    });
});
//# sourceMappingURL=fetchRoutes.js.map