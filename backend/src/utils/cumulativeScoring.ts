import {
  CumulativePlayerScores,
  PlayerScoreData,
  sanitizePlayerName,
} from "@ff-mern/ff-types";

// Replace the selected week, rather than adding it again on each scoring run.
export const calculateCumulativeScores = (
  previous: CumulativePlayerScores,
  week: number,
  data: PlayerScoreData
): CumulativePlayerScores => {
  const result: CumulativePlayerScores = JSON.parse(JSON.stringify(previous));
  const knownNames = new Map(
    Object.keys(result).map((name) => [sanitizePlayerName(name), name])
  );
  for (const [key, stats] of Object.entries(data)) {
    const name =
      knownNames.get(key) ||
      stats.statistics.Player?.replace(/\s*\([^)]*\)\s*$/, "").trim() ||
      key;
    const entry = result[name] ?? {
      position: stats.position,
      team: stats.team,
      pointsByWeek: Array(18).fill(0),
      totalPointsInSeason: 0,
    };
    entry.pointsByWeek[week - 1] = stats.scoring.totalPoints;
    entry.totalPointsInSeason = entry.pointsByWeek.reduce(
      (sum, points) => sum + points,
      0
    );
    result[name] = entry;
  }
  return result;
};
