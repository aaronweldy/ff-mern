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
} from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
// @ts-ignore
import scraper from "table-scraper";

export type ScrapedPlayer = Record<string, string>;
export const positions = ["qb", "rb", "wr", "te", "k"];

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
              sanitizePlayerName(player.Player),
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

export const fetchWeeklyStats = async (week: number) => {
  const year = new Date().getFullYear();
  let statsAtt = await db
    .collection("weekStats")
    .doc(year + "week" + week)
    .get();
  let usableStats: Record<string, DatabasePlayer> = {};
  if (!statsAtt.exists) {
    for await (const pos of positions) {
      const url = `https://www.fantasypros.com/nfl/stats/${pos}.php?year=${year}&week=${week}&range=week`;
      const table = await scraper.get(url);
      for (const player of table[0]) {
        const hashedName = player["Player"].replace(/\./g, "").toLowerCase();
        if (hashedName) {
          usableStats[hashedName.slice(0, hashedName.indexOf("(") - 1)] =
            pos === "QB"
              ? {
                  ...player,
                  "CP%":
                    Number.parseFloat(player["CMP"]) /
                    Number.parseFloat(player["ATT"]),
                  "Y/A":
                    Number.parseFloat(player["YDS"]) /
                    Number.parseFloat(player["ATT"]),
                  "Y/CMP":
                    Number.parseFloat(player["YDS"]) /
                    Number.parseFloat(player["CMP"]),
                }
              : player;
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
  const stats = await fetchWeeklyStats(week);
  const data: PlayerScoreData = {};
  players
    .filter((player) => player.name in stats)
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
              stats[player.name][
                convertedScoringTypes[player.position][cat.statType] as StatKey
              ]
            );
            if (isNaN(statNumber)) return { hashVal: 0 };
            switch (cat.qualifier) {
              case "per":
                console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
                points = (statNumber / cat.threshold) * category.points;
                break;
              case "greater than":
                console.log(`stat: ${statNumber}, thresh: ${cat.threshold}`);
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
                stats[player.name][
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
              `Error finding stats for player ${player.name}, ${player.position}`
            );
            return { hashVal: 0 };
          }
        });
      data[player.name] = {
        position: player.position,
        scoring: {
          totalPoints: Number.parseFloat(
            catPoints
              .reduce((acc, i) => acc + Object.values(i)[0], 0)
              .toPrecision(4)
          ),
          categories: Object.assign({}, ...catPoints),
        },
        statistics: stats[player.name],
      };
    });
  const yearWeek = new Date().getFullYear() + week.toString();
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
