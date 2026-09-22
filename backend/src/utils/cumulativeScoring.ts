import {
  CumulativePlayerScores,
  PlayerScoreData,
  sanitizePlayerName,
} from "@ff-mern/ff-types";
import { scoringName, scoringTeam } from "./scoringNames.js";

const identity = (name: string, position: string, team: string) =>
  `${position}:${scoringTeam(team)}:${scoringName(name)}`;

/** Join provider name variants only when their existing weekly scores agree. */
export const consolidateCumulativeScores = (
  previous: CumulativePlayerScores
): CumulativePlayerScores => {
  const result: CumulativePlayerScores = JSON.parse(JSON.stringify(previous));
  const groups = new Map<string, string[]>();
  for (const [name, entry] of Object.entries(result)) {
    const key = identity(name, entry.position, entry.team);
    groups.set(key, [...(groups.get(key) || []), name]);
  }
  for (const names of groups.values()) {
    if (names.length < 2) continue;
    const length = Math.max(
      ...names.map((name) => result[name].pointsByWeek.length)
    );
    const merged: number[] = [];
    let conflict = false;
    for (let index = 0; index < length; index++) {
      const points = new Set(
        names
          .map((name) => result[name].pointsByWeek[index] || 0)
          .filter((value) => value !== 0)
      );
      if (points.size > 1) {
        conflict = true;
        break;
      }
      merged.push([...points][0] || 0);
    }
    if (conflict) continue;
    result[names[0]].pointsByWeek = merged;
    result[names[0]].totalPointsInSeason = merged.reduce(
      (sum, points) => sum + points,
      0
    );
    for (const name of names.slice(1)) delete result[name];
  }
  return result;
};

// Replace the selected week, rather than adding it again on each scoring run.
export const calculateCumulativeScores = (
  previous: CumulativePlayerScores,
  week: number,
  data: PlayerScoreData
): CumulativePlayerScores => {
  const result = consolidateCumulativeScores(previous);
  const knownNames = new Map(
    Object.keys(result).map((name) => [sanitizePlayerName(name), name])
  );
  const namesByIdentity = new Map<string, string[]>();
  for (const [name, entry] of Object.entries(result)) {
    const key = identity(name, entry.position, entry.team);
    namesByIdentity.set(key, [...(namesByIdentity.get(key) || []), name]);
  }
  for (const [key, stats] of Object.entries(data)) {
    const playerIdentity = identity(key, stats.position, stats.team);
    const matches = namesByIdentity.get(playerIdentity);
    const name =
      knownNames.get(key) ||
      (matches?.length === 1 ? matches[0] : undefined) ||
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
    knownNames.set(sanitizePlayerName(name), name);
    if (!matches) namesByIdentity.set(playerIdentity, [name]);
  }
  return result;
};
