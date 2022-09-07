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
import scraper from "table-scraper";
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
        const tableData = yield scraper.get(url);
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
        for (const [abbrevTeam, fullTeam] of Object.entries(AbbreviationToFullTeam)) {
            const url = `https://www.fantasypros.com/nfl/depth-chart/${fullTeam
                .split(" ")
                .join("-")}.php`;
            const tableData = yield scraper.get(url);
            for (let i = 0; i < longPositions.length; ++i) {
                console.log(tableData[i]);
                for (const player of tableData[i]) {
                    players.push(new RosteredPlayer(player[longPositions[i]], abbrevTeam, positions[i]));
                }
            }
        }
        resolve(players);
    }));
};
export const fetchLatestFantasyProsScoredWeek = (targetWeek) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (yield fetch(`https://www.fantasypros.com/nfl/stats/qb.php?week=${targetWeek}&range=week`)).text();
    const $ = load(data);
    return parseInt($("#single-week").attr("value"));
});
export const fetchWeeklySnapCount = (week) => __awaiter(void 0, void 0, void 0, function* () {
    const year = getCurrentSeason();
    let curStats = (yield db
        .collection("weekStats")
        .doc(year + "week" + week)
        .get()).data().playerMap;
    for (const pos of positions.slice(0, 4)) {
        const url = `https://www.fantasypros.com/nfl/reports/snap-counts/${pos}.php`;
        const tableData = yield scraper.get(url);
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
    var e_1, _a;
    const year = getCurrentSeason();
    const latestScoredWeek = yield fetchLatestFantasyProsScoredWeek(week.toString());
    let usableStats = {};
    if (latestScoredWeek < week) {
        console.log("No stats for week " + week + " available");
        return usableStats;
    }
    let statsAtt = yield db
        .collection("weekStats")
        .doc(year + "week" + week)
        .get();
    if (!statsAtt.exists) {
        try {
            for (var positions_1 = __asyncValues(positions), positions_1_1; positions_1_1 = yield positions_1.next(), !positions_1_1.done;) {
                const pos = positions_1_1.value;
                const url = `https://www.fantasypros.com/nfl/stats/${pos}.php?year=${year}&week=${week}&range=week`;
                const table = yield scraper.get(url);
                for (const player of table[0]) {
                    const hashedName = sanitizePlayerName(player["Player"]);
                    if (hashedName) {
                        const team = hashedName
                            .slice(hashedName.indexOf("(") + 1, hashedName.indexOf(")"))
                            .toUpperCase();
                        usableStats[sanitizePlayerName(hashedName.slice(0, hashedName.indexOf("(") - 1))] =
                            pos === "QB"
                                ? Object.assign(Object.assign({}, player), { team, position: pos, PCT: (Number.parseFloat(player["CMP"]) /
                                        Number.parseFloat(player["ATT"])).toString(), "Y/A": (Number.parseFloat(player["YDS"]) /
                                        Number.parseFloat(player["ATT"])).toString(), "Y/CMP": (Number.parseFloat(player["YDS"]) /
                                        Number.parseFloat(player["CMP"])).toString() }) : Object.assign(Object.assign({}, player), { team, position: pos, PCT: "0", "Y/A": "0", "Y/CMP": "0" });
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (positions_1_1 && !positions_1_1.done && (_a = positions_1.return)) yield _a.call(positions_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        yield db
            .collection("weekStats")
            .doc(year + "week" + week)
            .set({ playerMap: usableStats });
    }
    else {
        usableStats = statsAtt.data().playerMap;
    }
    return usableStats;
});
export const scoreAllPlayers = (league, leagueId, week) => __awaiter(void 0, void 0, void 0, function* () {
    const players = yield fetchPlayers();
    yield fetchWeeklyStats(week);
    const stats = yield fetchWeeklySnapCount(week.toString());
    const data = {};
    players
        .filter((player) => player.sanitizedName in stats)
        .forEach((player) => {
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
                        //console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
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
                    return statNumber > min.threshold;
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