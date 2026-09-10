import { PlayerScoreData } from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";
import { calculateCumulativeScores } from "./cumulativeScoring.js";

export const updateCumulativeStats = async (
  leagueId: string,
  week: number,
  data: PlayerScoreData,
  transaction?: FirebaseFirestore.Transaction
) => {
  const ref = db.collection("cumulativePlayerScores").doc(leagueId);
  const snapshot = transaction ? await transaction.get(ref) : await ref.get();
  const scores = calculateCumulativeScores(snapshot.data() || {}, week, data);
  if (transaction) transaction.set(ref, scores);
  else await ref.set(scores);
};
