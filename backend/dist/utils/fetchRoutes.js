import { convertedScoringTypes, RosteredPlayer, sanitizePlayerName, getCurrentSeason, AbbreviationToFullTeam, } from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
import fetch from "node-fetch";
import { load } from "cheerio";
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
export const fetchPlayerProjections = async (week) => {
    const season = getCurrentSeason();
    const check = await db
        .collection("playerProjections")
        .doc(`${season}${week}`)
        .get();
    if (check.exists) {
        return check.data();
    }
    const scrapedProjections = {};
    for (const pos of positions) {
        const url = `https://www.fantasypros.com/nfl/projections/${pos}.php?week=${week}`;
        const tableData = await get(url);
        for (const player of tableData[0]) {
            if (player.Player !== "") {
                scrapedProjections[sliceTeamFromName(sanitizePlayerName(player.Player))] = parseFloat(player.FPTS);
            }
        }
    }
    await db
        .collection("playerProjections")
        .doc(`${season}week${week}`)
        .set(scrapedProjections);
    return scrapedProjections;
};
export const fetchPlayers = () => {
    return new Promise(async (resolve, _) => {
        const players = [];
        const kickerUrl = "https://www.fantasypros.com/nfl/projections/k.php";
        const kickerData = await get(kickerUrl);
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
            const tableData = await get(url);
            for (let i = 0; i < longPositions.length; ++i) {
                for (const player of tableData[i]) {
                    players.push(new RosteredPlayer(player[longPositions[i]], abbrevTeam, positions[i].toUpperCase()));
                }
            }
        }
        resolve(players);
    });
};
export const fetchLatestFantasyProsScoredWeek = async (targetWeek) => {
    const data = await (await fetch(`https://www.fantasypros.com/nfl/stats/qb.php?week=${targetWeek}&range=week`)).text();
    const $ = load(data);
    return [parseInt($(".select-links").eq(0).find(":selected").text()), parseInt($("#single-week").attr("value"))];
};
/**
 * Fetches the weekly stats that were previously stored by fetchWeeklyStats.
 * Note: Snap count fetching was removed because the FantasyPros snap counts page
 * is now gated behind a registration wall. Backup resolution now uses the "G" (games played)
 * stat instead of snap counts.
 */
export const fetchWeeklySnapCount = async (week) => {
    const year = getCurrentSeason();
    console.log(year);
    const curStats = (await db
        .collection("weekStats")
        .doc(year + "week" + week)
        .get()).data().playerMap;
    return curStats;
};
export const fetchWeeklyStats = async (week) => {
    const year = getCurrentSeason();
    console.log("season is: ", year);
    const [season, latestScoredWeek] = await fetchLatestFantasyProsScoredWeek(week.toString());
    console.log("Parsed season: " + season);
    const usableStats = {};
    if (latestScoredWeek < week || season < year) {
        console.log("No stats for " + season + " week " + week + " available");
        return usableStats;
    }
    for await (const pos of positions) {
        const url = `https://www.fantasypros.com/nfl/stats/${pos}.php?year=${year}&week=${week}&range=week`;
        const table = await get(url);
        for (const player of table[0]) {
            const hashedName = sanitizePlayerName(player["Player"]);
            if (hashedName) {
                const team = hashedName
                    .slice(hashedName.indexOf("(") + 1, hashedName.indexOf(")"))
                    .toUpperCase();
                usableStats[sanitizePlayerName(hashedName.slice(0, hashedName.indexOf("(") - 1))] =
                    pos === "qb"
                        ? {
                            ...player,
                            team,
                            position: pos,
                            PCT: Number.parseFloat(player["PCT"]).toFixed(2).toString(),
                            "Y/A": Number.parseFloat(player["Y/A"]).toFixed(2).toString() || "0",
                            "Y/A_2": (Number.parseFloat(player["YDS_2"]) /
                                (Number.parseFloat(player["ATT_2"]) || 1))
                                .toFixed(2)
                                .toString(),
                            "Y/CMP": (Number.parseFloat(player["YDS"]) /
                                (Number.parseFloat(player["CMP"]) || 1))
                                .toFixed(2)
                                .toString(),
                        }
                        : {
                            ...player,
                            team,
                            position: pos,
                            PCT: "0",
                            "Y/A": player["Y/A"] || "0",
                            "Y/CMP": "0",
                        };
            }
        }
    }
    await db
        .collection("weekStats")
        .doc(year + "week" + week)
        .set({ playerMap: usableStats });
    return usableStats;
};
export const scoreAllPlayers = async (league, leagueId, week) => {
    const data = {};
    const statsAtt = await fetchWeeklyStats(week);
    if (Object.keys(statsAtt).length === 0) {
        return data;
    }
    const stats = await fetchWeeklySnapCount(week.toString());
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
                const retObj = {};
                retObj[hashVal] =
                    successMins.length === category.minimums.length ? points : 0;
                return retObj;
            }
            catch (error) {
                console.error(`Error finding stats for player ${player.fullName}, ${player.position}:`, error);
                return { [hashVal]: 0 };
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
    await db
        .collection("leagueScoringData")
        .doc(yearWeek + leagueId)
        .set({ playerData: data });
    return data;
};
export const getTeamsInLeague = async (id) => {
    return await db
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
};
//# sourceMappingURL=fetchRoutes.js.map