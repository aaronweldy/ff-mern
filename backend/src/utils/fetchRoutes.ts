import {
  convertedScoringTypes,
  DatabasePlayer,
  League,
  PlayerScoreData,
  RosteredPlayer,
  sanitizePlayerName,
  SinglePosition,
  StatKey,
  Team,
  AbbreviatedNflTeam,
  Week,
  ScrapedPlayerProjection,
  getCurrentSeason,
} from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
import fetch from "node-fetch";
import { load } from "cheerio";
// @ts-ignore
import scraper from "table-scraper";

export type ScrapedPlayer = Record<string, string>;
export type TableScraperStatsResponse = Omit<
  DatabasePlayer,
  "CP%" | "Y/A" | "Y/CMP"
>;
export type PlayerSnapCountsResponse = {
  1: Week;
  2: Week;
  3: Week;
  4: Week;
  5: Week;
  6: Week;
  7: Week;
  8: Week;
  9: Week;
  10: Week;
  11: Week;
  12: Week;
  13: Week;
  14: Week;
  15: Week;
  16: Week;
  17: Week;
  18: Week;
  Player: string;
  Team: AbbreviatedNflTeam;
  TTL: string;
  AVG: string;
};
export const positions = ["qb", "rb", "wr", "te", "k"];

const sliceTeamFromName = (name: string) => {
  const lastSpace = name.lastIndexOf(" ");
  return name.substring(0, lastSpace);
};

export const fetchPlayerProjections = async (week: Week) => {
  const season = getCurrentSeason();
  const check = await db
    .collection("playerProjections")
    .doc(`${season}${week}`)
    .get();
  if (check.exists) {
    return check.data() as Record<string, number>;
  }
  let scrapedProjections: Record<string, number> = {};
  for (const pos of positions) {
    const url = `https://www.fantasypros.com/nfl/projections/${pos}.php?week=${week}`;
    const tableData = await scraper.get(url);
    for (const player of tableData[0] as ScrapedPlayerProjection[]) {
      if (player.Player !== "") {
        scrapedProjections[
          sliceTeamFromName(sanitizePlayerName(player.Player))
        ] = parseFloat(player.FPTS);
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
  return new Promise<RosteredPlayer[]>(async (resolve, _) => {
    let players: RosteredPlayer[] = [];
    for (const pos of positions) {
      const url = `https://www.fantasypros.com/nfl/reports/leaders/${pos}.php`;
      const tableData = await scraper.get(url);
      for (const player of tableData[0] as ScrapedPlayer[]) {
        if (player.Player !== "") {
          players.push(
            new RosteredPlayer(
              player.Player,
              player.Team as AbbreviatedNflTeam,
              pos.toUpperCase() as SinglePosition
            )
          );
        }
      }
    }
    resolve(players);
  });
};

export const fetchLatestFantasyProsScoredWeek = async (targetWeek: string) => {
  const data = await (
    await fetch(
      `https://www.fantasypros.com/nfl/stats/qb.php?week=${targetWeek}&range=week`
    )
  ).text();
  const $ = load(data);
  return parseInt($("#single-week").attr("value"));
};

export const fetchWeeklySnapCount = async (week: Week) => {
  const year = getCurrentSeason();
  let curStats = (
    await db
      .collection("weekStats")
      .doc(year + "week" + week)
      .get()
  ).data().playerMap as Record<string, DatabasePlayer>;
  for (const pos of positions.slice(0, 4)) {
    const url = `https://www.fantasypros.com/nfl/reports/snap-counts/${pos}.php`;
    const tableData = await scraper.get(url);
    const players = tableData[0] as PlayerSnapCountsResponse[];
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
};

export const fetchWeeklyStats = async (week: number) => {
  const year = getCurrentSeason();
  const latestScoredWeek = await fetchLatestFantasyProsScoredWeek(
    week.toString()
  );
  let usableStats: Record<string, DatabasePlayer> = {};
  if (latestScoredWeek < week) {
    console.log("No stats for week " + week + " available");
    return usableStats;
  }
  let statsAtt = await db
    .collection("weekStats")
    .doc(year + "week" + week)
    .get();

  if (!statsAtt.exists) {
    for await (const pos of positions) {
      const url = `https://www.fantasypros.com/nfl/stats/${pos}.php?year=${year}&week=${week}&range=week`;
      const table: TableScraperStatsResponse[][] = await scraper.get(url);
      for (const player of table[0]) {
        const hashedName = sanitizePlayerName(player["Player"]);
        if (hashedName) {
          const team = hashedName
            .slice(hashedName.indexOf("(") + 1, hashedName.indexOf(")"))
            .toUpperCase() as AbbreviatedNflTeam;
          usableStats[
            sanitizePlayerName(hashedName.slice(0, hashedName.indexOf("(") - 1))
          ] =
            pos === "QB"
              ? {
                  ...player,
                  team,
                  position: pos,
                  PCT: (
                    Number.parseFloat(player["CMP"]) /
                    Number.parseFloat(player["ATT"])
                  ).toString(),
                  "Y/A": (
                    Number.parseFloat(player["YDS"]) /
                    Number.parseFloat(player["ATT"])
                  ).toString(),
                  "Y/CMP": (
                    Number.parseFloat(player["YDS"]) /
                    Number.parseFloat(player["CMP"])
                  ).toString(),
                }
              : {
                  ...player,
                  team,
                  position: pos,
                  PCT: "0",
                  "Y/A": "0",
                  "Y/CMP": "0",
                };
        }
      }
    }
    await db
      .collection("weekStats")
      .doc(year + "week" + week)
      .set({ playerMap: usableStats });
  } else {
    usableStats = (
      statsAtt.data() as { playerMap: Record<string, DatabasePlayer> }
    ).playerMap;
  }
  return usableStats;
};

export const scoreAllPlayers = async (
  league: League,
  leagueId: string,
  week: number
) => {
  const players = await fetchPlayers();
  await fetchWeeklyStats(week);
  const stats = await fetchWeeklySnapCount(week.toString() as Week);
  const data: PlayerScoreData = {};
  players
    .filter((player) => player.sanitizedName in stats)
    .forEach((player) => {
      const catPoints = league.scoringSettings
        .filter((set) => set.position.indexOf(player.position) >= 0)
        .map((category) => {
          const cat = category["category"];
          const hashVal =
            cat.qualifier === "between"
              ? `${cat.qualifier}|${cat.thresholdMax}${cat.thresholdMin}|${cat.statType}`
              : `${cat.qualifier}|${cat.threshold}|${cat.statType}`;
          let points = 0;
          try {
            const statNumber = Number.parseFloat(
              stats[player.sanitizedName][
                convertedScoringTypes[player.position][cat.statType] as StatKey
              ]
            );
            if (isNaN(statNumber)) return { hashVal: 0 };
            switch (cat.qualifier) {
              case "per":
                //console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
                points = (statNumber / cat.threshold) * category.points;
                break;
              case "greater than":
                //console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
                if (statNumber >= cat.threshold) points = category.points;
                break;
              case "between":
                if (
                  statNumber >= (cat.thresholdMin || Infinity) &&
                  statNumber <= (cat.thresholdMax || -Infinity)
                )
                  points = category.points;
                break;
            }
            const successMins = category.minimums.filter((min) => {
              const statNumber = Number.parseFloat(
                stats[player.sanitizedName][
                  convertedScoringTypes[player.position][
                    min.statType
                  ] as StatKey
                ]
              );
              return statNumber > min.threshold;
            });
            let retObj: Record<string, number> = {};
            retObj[hashVal] =
              successMins.length === category.minimums.length ? points : 0;
            return retObj;
          } catch (error) {
            console.log(
              `Error finding stats for player ${player.fullName}, ${player.position}`
            );
            return { hashVal: 0 };
          }
        });
      data[player.sanitizedName] = {
        team: stats[player.sanitizedName].team as AbbreviatedNflTeam,
        position: player.position,
        scoring: {
          totalPoints: Number.parseFloat(
            catPoints
              .reduce((acc, i) => acc + Object.values(i)[0], 0)
              .toPrecision(4)
          ),
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

export const getTeamsInLeague = async (id: string) => {
  return await db
    .collection("teams")
    .where("league", "==", id)
    .get()
    .then((teamSnapshot) => {
      const teams: Team[] = [];
      teamSnapshot.forEach((teamData) => {
        teams.push(teamData.data() as Team);
      });
      return teams;
    });
};
