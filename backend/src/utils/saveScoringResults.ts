import { isDeepStrictEqual } from "node:util";
import type { Firestore } from "firebase-admin/firestore";
import {
  League,
  PlayerScoreData,
  RunScoresResponse,
  Team,
  getCurrentSeason,
} from "@ff-mern/ff-types";
import { calculateCumulativeScores } from "./cumulativeScoring.js";
import { withRosterScoreAliases } from "./scoringNames.js";
import { resolveScoringLineup } from "./scoringResolution.js";

/** Recalculate from current lineups, but only send changed results to Firestore. */
export const saveScoringResults = async (
  db: Firestore,
  leagueId: string,
  league: League,
  week: number,
  data: PlayerScoreData,
  completed: Set<string>
): Promise<RunScoresResponse & { updated: boolean }> => {
  const leagueRef = db.collection("leagues").doc(leagueId);
  const weeklyRef = db
    .collection("leagueScoringData")
    .doc(`${getCurrentSeason()}${week}${leagueId}`);
  const cumulativeRef = db.collection("cumulativePlayerScores").doc(leagueId);

  return db.runTransaction(async (transaction) => {
    // All comparisons use transactional reads, so overlapping runs and lineup
    // saves retry against current results instead of committing a stale plan.
    const [leagueSnapshot, weeklySnapshot, cumulativeSnapshot] =
      await transaction.getAll(leagueRef, weeklyRef, cumulativeRef);
    const currentLeague = leagueSnapshot.data() as League | undefined;
    if (
      !currentLeague ||
      !isDeepStrictEqual(currentLeague.scoringSettings, league.scoringSettings)
    ) {
      throw new Error(
        "Scoring settings changed during this run; please calculate scores again."
      );
    }
    if (week > currentLeague.numWeeks) {
      throw new Error("Week is out of range");
    }
    const snapshot = await transaction.get(
      db.collection("teams").where("league", "==", leagueId)
    );
    const teams = snapshot.docs.map((doc) => doc.data() as Team);
    const scoringData = withRosterScoreAliases(data, teams, week);
    const errors: RunScoresResponse["errors"] = [];
    const teamUpdates = teams.map((team) => {
      const resolved = resolveScoringLineup(team, week, scoringData, completed);
      errors.push(...resolved.errors);
      const info = {
        ...team.weekInfo[week],
        weekScore: resolved.weekScore,
        scoringLineup: resolved.lineup,
        substitutions: resolved.substitutions,
      };
      const changed = !isDeepStrictEqual(team.weekInfo[week], info);
      team.weekInfo[week] = info;
      return changed;
    });
    const previousCumulative = cumulativeSnapshot.data() || {};
    // Use original provider keys; roster aliases must never duplicate totals.
    const cumulative = calculateCumulativeScores(
      previousCumulative,
      week,
      data
    );
    const weeklyChanged = !isDeepStrictEqual(
      weeklySnapshot.data()?.playerData,
      scoringData
    );
    const cumulativeChanged = !isDeepStrictEqual(
      previousCumulative,
      cumulative
    );
    const lastScoredWeek = Math.max(week, currentLeague.lastScoredWeek || 0);
    const leagueChanged = currentLeague.lastScoredWeek !== lastScoredWeek;

    // Finish calculating every result before queuing any writes. Firestore
    // commits changed teams, player scores, totals and status atomically.
    snapshot.docs.forEach((doc, index) => {
      if (teamUpdates[index]) {
        transaction.update(doc.ref, { weekInfo: teams[index].weekInfo });
      }
    });
    if (weeklyChanged) transaction.set(weeklyRef, { playerData: scoringData });
    if (cumulativeChanged) transaction.set(cumulativeRef, cumulative);
    if (leagueChanged) transaction.update(leagueRef, { lastScoredWeek });

    return {
      teams,
      errors,
      data: scoringData,
      updated:
        weeklyChanged ||
        cumulativeChanged ||
        leagueChanged ||
        teamUpdates.some(Boolean),
    };
  });
};
