var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { db } from "../config/firebase-config.js";
export const updateCumulativeStats = (leagueId, week, data) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("updating stats");
    let curStats = (yield db.collection("cumulativePlayerScores").doc(leagueId).get()).data();
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
        }
        else {
            curStats[player].pointsByWeek[week - 1] = playerPointsInWeek;
            curStats[player].totalPointsInSeason = curStats[player].pointsByWeek.reduce((acc, score) => acc + score, 0);
        }
    });
    yield db.collection("cumulativePlayerScores").doc(leagueId).set(curStats);
});
//# sourceMappingURL=updateCumulativeStats.js.map