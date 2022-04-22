import { CumulativePlayerScores, PlayerScoreData } from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
import { fetchPlayers } from "./fetchRoutes.js";

export const updateCumulativeStats = async (
  leagueId: string,
  week: number,
  data: PlayerScoreData
) => {
  console.log("updating stats");
  const curPlayers = await fetchPlayers();
  let curStats: CumulativePlayerScores = (
    await db.collection("cumulativePlayerScores").doc(leagueId).get()
  ).data();
  if (!curStats) {
    curStats = {};
  }
  curPlayers.forEach((player) => {
    if (!(player.sanitizedName in data)) {
      return;
    }
    const playerPointsInWeek = data[player.sanitizedName].scoring.totalPoints;
    if (!(player.fullName in curStats)) {
      curStats[player.fullName] = {
        position: data[player.sanitizedName].position,
        totalPointsInSeason: playerPointsInWeek,
        pointsByWeek: [...Array(18).fill(0)],
      };
      curStats[player.fullName].pointsByWeek[week - 1] = playerPointsInWeek;
    } else {
      curStats[player.fullName].pointsByWeek[week - 1] = playerPointsInWeek;
      curStats[player.fullName].totalPointsInSeason = curStats[
        player.fullName
      ].pointsByWeek.reduce((acc: number, score: number) => acc + score, 0);
    }
  });
  await db.collection("cumulativePlayerScores").doc(leagueId).set(curStats);
};
