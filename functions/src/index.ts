import * as functions from "firebase-functions";
import admin from "firebase-admin";
//@ts-ignore
import scraper from "table-scraper";
import {
  AbbreviatedNflTeam,
  AbbreviationToFullTeam,
  FullNflTeam,
  singlePositionTypes,
  ScrapedADPData,
  TeamFantasyPositionPerformance,
  TeamToSchedule,
  Week,
  ProjectedPlayer,
  sanitizePlayerName,
  playerTeamIsNflAbbreviation,
} from "@ff-mern/ff-types";
import fetch from "node-fetch";
import { load } from "cheerio";

admin.initializeApp();
const db = admin.firestore();

type ScrapedTeamData = {
  Team: string;
  Rank: string;
  QB: string;
  Rank_2: string;
  RB: string;
  Rank_3: string;
  WR: string;
  Rank_4: string;
  TE: string;
  Rank_5: string;
  K: string;
  Rank_6: string;
  DST: string;
};

const fetchTeamDefensePerformance = async () => {
  const url = "https://www.fantasypros.com/nfl/points-allowed.php";
  const data = await scraper.get(url);
  let updateData: TeamFantasyPositionPerformance =
    {} as TeamFantasyPositionPerformance;
  (data[0] as ScrapedTeamData[]).forEach((teamData) => {
    updateData[teamData.Team.toLowerCase() as FullNflTeam] = {
      QB: parseInt(teamData.Rank),
      RB: parseInt(teamData.Rank_2),
      WR: parseInt(teamData.Rank_3),
      TE: parseInt(teamData.Rank_4),
      K: parseFloat(teamData.Rank_5),
    };
  });
  await db.collection("nflDefenseVsPositionStats").doc("dist").set(updateData);
};

const parsePlayerFromScrapedData = (playerString: string) => {
  const playerSegments = playerString.split(" ");
  let [player, team, byeWeek] = [
    playerSegments.slice(0, -2).join(" "),
    playerSegments.slice(-2, -1)[0],
    playerSegments.slice(-1)[0].slice(1, -1) as Week,
  ];
  if (!player) {
    return null;
  }
  // Unsigned players don't have a team/bye week, so the parsing needs to be updated.
  if (!playerTeamIsNflAbbreviation(team)) {
    team = "None";
    byeWeek = "1";
    player = playerSegments.join(" ");
  }
  return {
    player,
    team,
    byeWeek,
  };
};

const fetchSeasonProjections = async () => {
  let playerAvgAdp: Record<string, number> = {};
  const overallUrl = "https://www.fantasypros.com/nfl/adp/overall.php";
  const overallData = (await scraper.get(overallUrl))[0] as {
    "Player Team (Bye)": string;
    AVG: string;
  }[];
  for (const data of overallData) {
    const parsedData = parsePlayerFromScrapedData(data["Player Team (Bye)"]);
    if (!parsedData) {
      continue;
    }
    const { player } = parsedData;
    playerAvgAdp[player] = parseFloat(data.AVG);
  }
  for (const pos of singlePositionTypes) {
    const url = `https://www.fantasypros.com/nfl/adp/${pos.toLowerCase()}.php`;
    const data = (await scraper.get(url))[0] as ScrapedADPData[];
    data.forEach((playerData) => {
      if (playerData["Player Team (Bye)"]) {
        const parsedData = parsePlayerFromScrapedData(
          playerData["Player Team (Bye)"]
        );
        if (parsedData) {
          const { player, team, byeWeek } = parsedData;
          const dbData: ProjectedPlayer = {
            fullName: player,
            sanitizedName: sanitizePlayerName(player),
            overall: parseInt(playerData.Overall) || 500,
            positionRank: `${pos}${playerData[pos]}`,
            team: (team as AbbreviatedNflTeam) ?? "None",
            byeWeek: byeWeek ?? "1",
            position: pos,
            average: playerAvgAdp[player] || 500,
          };
          db.collection("playerADP")
            .doc(player)
            .set({
              ...dbData,
            });
        }
      }
    });
  }
};

export const fetchRankings = functions.pubsub
  .schedule("every day 00:00")
  .onRun(async () => {
    await fetchTeamDefensePerformance();
    await fetchSeasonProjections();
  });

export const fetchNflSchedule = functions.pubsub
  .schedule("1st thursday of month 00:00")
  .onRun(async () => {
    const url = "http://www.espn.com/nfl/schedulegrid/_/";
    const data: Record<Week | "0", AbbreviatedNflTeam | "WSH">[] = (
      await scraper.get(url)
    )[0];
    const dbUpdate: TeamToSchedule = {} as TeamToSchedule;
    for (let i = 2; i < data.length; i++) {
      dbUpdate[AbbreviationToFullTeam[data[i]["0"]]] = data[i] as Record<
        Week | "0",
        AbbreviatedNflTeam
      >;
    }
    db.collection("nflTeamSchedules").doc("dist").set(dbUpdate);
  });

export const runScoresForAllLeagues = functions.pubsub
  .schedule("0 2,22 * * *")
  .timeZone("America/Los_Angeles")
  .onRun(async () => {
    const allLeagues = await db.collection("leagues").get();
    const latestWeek = parseInt((await getWeekFromPuppeteer()) || "1");
    allLeagues.forEach((league) => {
      const leagueId = league.id;
      const url = `${process.env.SERVER_URL}/api/v1/league/${leagueId}/runScores/`;
      console.log("fetching league at url: ", url);
      const body = { week: latestWeek };
      const request = {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      };
      fetch(url, request).catch((err) => console.log(err));
    });
  });

const getWeekFromPuppeteer = async () => {
  const data = await (
    await fetch(`https://www.fantasypros.com/nfl/stats/qb.php?range=week`)
  ).text();
  const $ = load(data);
  return $("#single-week").attr("value");
};

export const fetchLatestFantasyProsScoredWeek = functions
  .runWith({ timeoutSeconds: 60 })
  .https.onCall(async () => {
    const week = await getWeekFromPuppeteer();
    return { week: parseInt(week || "1") };
  });
