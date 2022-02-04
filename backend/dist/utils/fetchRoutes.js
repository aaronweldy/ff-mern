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
import { convertedScoringTypes, RosteredPlayer, sanitizePlayerName, } from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
// @ts-ignore
import scraper from "table-scraper";
export const positions = ["qb", "rb", "wr", "te", "k"];
export const fetchPlayers = () => {
    return new Promise((resolve, _) => __awaiter(void 0, void 0, void 0, function* () {
        let players = [];
        for (const pos of positions) {
            const url = `https://www.fantasypros.com/nfl/reports/leaders/${pos}.php`;
            const tableData = yield scraper.get(url);
            for (const player of tableData[0]) {
                if (player.Player !== "") {
                    players.push(new RosteredPlayer(sanitizePlayerName(player.Player), player.Team, pos.toUpperCase()));
                }
            }
        }
        resolve(players);
    }));
};
export const fetchWeeklyStats = (week) => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    const year = new Date().getFullYear();
    let statsAtt = yield db
        .collection("weekStats")
        .doc(year + "week" + week)
        .get();
    let usableStats = {};
    if (!statsAtt.exists) {
        try {
            for (var positions_1 = __asyncValues(positions), positions_1_1; positions_1_1 = yield positions_1.next(), !positions_1_1.done;) {
                const pos = positions_1_1.value;
                const url = `https://www.fantasypros.com/nfl/stats/${pos}.php?year=${year}&week=${week}&range=week`;
                const table = yield scraper.get(url);
                for (const player of table[0]) {
                    const hashedName = player["Player"].replace(/\./g, "").toLowerCase();
                    if (hashedName) {
                        usableStats[hashedName.slice(0, hashedName.indexOf("(") - 1)] =
                            pos === "QB"
                                ? Object.assign(Object.assign({}, player), { "CP%": Number.parseFloat(player["CMP"]) /
                                        Number.parseFloat(player["ATT"]), "Y/A": Number.parseFloat(player["YDS"]) /
                                        Number.parseFloat(player["ATT"]), "Y/CMP": Number.parseFloat(player["YDS"]) /
                                        Number.parseFloat(player["CMP"]) }) : player;
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
    const stats = yield fetchWeeklyStats(week);
    const data = {};
    players
        .filter((player) => player.name in stats)
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
                const statNumber = Number.parseFloat(stats[player.name][convertedScoringTypes[player.position][cat.statType]]);
                if (isNaN(statNumber))
                    return { hashVal: 0 };
                switch (cat.qualifier) {
                    case "per":
                        console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
                        points = (statNumber / cat.threshold) * category.points;
                        break;
                    case "greater than":
                        console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
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
                    const statNumber = Number.parseFloat(stats[player.name][convertedScoringTypes[player.position][min.statType]]);
                    return statNumber > min.threshold;
                });
                let retObj = {};
                retObj[hashVal] =
                    successMins.length === category.minimums.length ? points : 0;
                return retObj;
            }
            catch (error) {
                console.log(`Error finding stats for player ${player.name}, ${player.position}`);
                return { hashVal: 0 };
            }
        });
        data[player.name] = {
            position: player.position,
            scoring: {
                totalPoints: Number.parseFloat(catPoints
                    .reduce((acc, i) => acc + Object.values(i)[0], 0)
                    .toPrecision(4)),
                categories: Object.assign({}, ...catPoints),
            },
            statistics: stats[player.name],
        };
    });
    const yearWeek = new Date().getFullYear() + week.toString();
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