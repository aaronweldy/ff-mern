import { db } from "../config/firebase-config.js";
import { calculateCumulativeScores } from "./cumulativeScoring.js";
export const updateCumulativeStats = async (leagueId, week, data, transaction) => {
    const ref = db.collection("cumulativePlayerScores").doc(leagueId);
    const snapshot = transaction ? await transaction.get(ref) : await ref.get();
    const scores = calculateCumulativeScores(snapshot.data() || {}, week, data);
    if (transaction)
        transaction.set(ref, scores);
    else
        await ref.set(scores);
};
//# sourceMappingURL=updateCumulativeStats.js.map