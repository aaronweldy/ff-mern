import { onSchedule } from "firebase-functions/scheduler";
import { onRequest } from "firebase-functions/https";
import admin from "firebase-admin";
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
  NFLSchedule,
  ESPNResponse,
} from "@ff-mern/ff-types";
import fetch from "node-fetch";
import { load } from "cheerio";

admin.initializeApp();
const db = admin.firestore();
import request from 'request';
import xray from 'x-ray';
import { tabletojson } from 'tabletojson';
var x = xray();
/**
 * Retrieve a web page and extract all tables from the HTML.
 * @param {string} url The URL of the page to retrieve.
 * @returns {Promise<Array<any>>} A promise that resolves to an array of table data.
 */
export const get = async (url: string): Promise<Array<any>> => {
  return new Promise<Array<any>>((resolve, reject) => {
    request.get(url, (err, response, body) => {
      if (err) {
        return reject(err);
      }
      if (response.statusCode >= 400) {
        return reject(new Error('The website requested returned an error!'));
      }
      x(body, ['table@html'])(async (conversionError, tableHtmlList) => {
        if (conversionError) {
          return reject(conversionError);
        }
        const data = await Promise.all(tableHtmlList.map((table: string) => {
          // xray returns the html inside each table tag, and tabletojson
          // expects a valid html table, so we need to re-wrap the table.
          // Returning the first element in the converted array because
          // we should only ever be parsing one table at a time within this map.
          return tabletojson.convert('<table>' + table + '</table>')[0];
        }));
        resolve(data);
      });
    });
  });
};


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
  const data = await get(url);
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

async function fetchAndParseESPNSchedule(schedule: NFLSchedule, week: number): Promise<void> {
  const url = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: ESPNResponse = await response.json();

    for (const event of data.events) {
      const gameTime = new Date(event.date);

      for (const competitor of event.competitions[0].competitors) {
        const teamName = competitor.team.abbreviation;
        const isHome = competitor.homeAway === 'home';
        const opponent = event.competitions[0].competitors.find(c => c.id !== competitor.id)?.team.abbreviation;

        if (!opponent) {
          console.error(`No opponent found for ${teamName} in week ${week}`);
          continue;
        }

        if (!schedule[teamName]) {
          schedule[teamName] = {};
        }

        schedule[teamName][data.week.number] = {
          opponent,
          isHome,
          gameTime: gameTime.toISOString()
        };
      }
    }

  } catch (error) {
    console.error(`Error fetching data for week ${week}:`, error);
  }
}

async function updateFirebase(schedule: NFLSchedule): Promise<void> {
  const scheduleRef = db.collection('nflSchedule');

  for (const [team, games] of Object.entries(schedule)) {
    await scheduleRef.doc(team).set(games);
  }

  console.log('Firebase updated successfully');
}

async function updateScheduleForAllWeeks(startWeek: number, endWeek: number): Promise<void> {
  const schedule = {}
  for (let week = startWeek; week <= endWeek; week++) {
    console.log(`Processing week ${week}...`);

    await fetchAndParseESPNSchedule(schedule, week);

    // Add a delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(schedule)
  }
  if (schedule) {
    await updateFirebase(schedule);
  }
}

const fetchSeasonProjections = async () => {
  let playerAvgAdp: Record<string, number> = {};
  const overallUrl = "https://www.fantasypros.com/nfl/adp/overall.php";
  const overallData = (await get(overallUrl))[0] as {
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
    const data = (await get(url))[0] as ScrapedADPData[];
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

export const fetchRankings = onSchedule("every day 00:00",
  async () => {
    await fetchTeamDefensePerformance();
    await fetchSeasonProjections();
  });

export const fetchNflSchedule =
  onSchedule("every day 00:00", async () => {
    await updateScheduleForAllWeeks(1, 18);
    const url = "http://www.espn.com/nfl/schedulegrid/_/";
    const data: Record<Week | "0", AbbreviatedNflTeam | "WSH">[] = (
      await get(url)
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

export const runScoresForAllLeagues = onSchedule(
  "0 2,22 * * *",
  async () => {
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

export const fetchLatestFantasyProsScoredWeek = onRequest(
  { timeoutSeconds: 60 },
  async (req, res) => {
    const week = await getWeekFromPuppeteer();
    res.status(200).json({ week: parseInt(week || "1") })
  });
