import * as functions from "firebase-functions";
import admin from "firebase-admin";
//@ts-ignore
import scraper from "table-scraper";
import {
  AbbreviatedNflTeam,
  FullNflTeam,
  TeamFantasyPositionPerformance,
  TeamToSchedule,
  Week,
} from "@ff-mern/ff-types";
import puppeteer from "puppeteer";
import fetch from "node-fetch";

admin.initializeApp();
const db = admin.firestore();

//const positions = ["qb", "wr", "rb", "te", "k"];

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

export const fetchRankings = functions.pubsub
  .schedule("every day 00:00")
  .onRun(async () => {
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
    db.collection("nflDefenseVsPositionStats").doc("dist").set(updateData);
  });

export const fetchNflSchedule = functions.pubsub
  .schedule("1st thursday of month 00:00")
  .onRun(async () => {
    const url = "http://www.espn.com/nfl/schedulegrid";
    const data: Record<Week | "0", AbbreviatedNflTeam | "WSH">[] = (
      await scraper.get(url)
    )[0];
    const dbUpdate: TeamToSchedule = {} as TeamToSchedule;
    for (let i = 2; i < data.length; i++) {
      dbUpdate[
        data[i]["0"] === "WSH" ? "WAS" : (data[i]["0"] as AbbreviatedNflTeam)
      ] = data[i] as Record<Week | "0", AbbreviatedNflTeam>;
    }
    db.collection("nflTeamSchedules").doc("dist").set(dbUpdate);
  });

export const runScoresForAllLeagues = functions.pubsub
  .schedule("every 12 hours")
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
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.resourceType() === "image") {
      req.abort();
    } else {
      req.continue();
    }
  });
  await page.goto(`https://www.fantasypros.com/nfl/stats/qb.php?range=week`, {
    waitUntil: "domcontentloaded",
    timeout: 60 * 1000,
  });
  await page.waitForSelector("#single-week");
  const week = await page.$eval("#single-week", (el) =>
    el.getAttribute("value")
  );
  await browser.close();
  return week;
};

export const fetchLatestFantasyProsScoredWeek = functions
  .runWith({ timeoutSeconds: 60 })
  .https.onCall(async () => {
    const week = await getWeekFromPuppeteer();
    return { week: parseInt(week || "1") };
  });
