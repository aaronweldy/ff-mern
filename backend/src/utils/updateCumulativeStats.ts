import { CumulativePlayerScores, PlayerScoreData } from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";

export const updateCumulativeStats = async (
  leagueId: string,
  week: number,
  data: PlayerScoreData
) => {
  console.log("updating stats");
  let curStats: CumulativePlayerScores = (
    await db.collection("cumulativePlayerScores").doc(leagueId).get()
  ).data();
  if (!curStats) {
    curStats = {};
  }
  Object.keys(data).forEach((player) => {
    const playerPointsInWeek = data[player].scoring.totalPoints;
    if (!(player in curStats)) {
      curStats[player] = {
        position: data[player].position,
        totalPointsInSeason: playerPointsInWeek,
        pointsByWeek: [...Array(18).fill(0)],
      };
      curStats[player].pointsByWeek[week - 1] = playerPointsInWeek;
    } else {
      curStats[player].pointsByWeek[week - 1] = playerPointsInWeek;
      curStats[player].totalPointsInSeason = curStats[
        player
      ].pointsByWeek.reduce((acc: number, score: number) => acc + score, 0);
    }
  });
  await db.collection("cumulativePlayerScores").doc(leagueId).set(curStats);
};
