import {
  NflPlayer,
  PlayerScoreData,
  Team,
  sanitizePlayerName,
} from "@ff-mern/ff-types";
import { canonicalizePlayerName } from "./nflverseParity.js";

export const scoringName = (name: string): string =>
  canonicalizePlayerName(sanitizePlayerName(name).trim().replace(/\s+/g, " "));

export const scoringTeam = (team: string): string =>
  ({ WAS: "WSH", JAX: "JAC", LA: "LAR" }[team] || team);

/** Keep stored roster keys intact while exposing uniquely matched source scores. */
export const withRosterScoreAliases = (
  data: PlayerScoreData,
  teams: Team[],
  week: number
): PlayerScoreData => {
  const result = { ...data };
  const candidates = new Map<string, Map<string, PlayerScoreData[string]>>();
  for (const [name, score] of Object.entries(data)) {
    const key = `${score.position}:${scoringName(name)}`;
    const matches = candidates.get(key) || new Map();
    // Previously saved aliases share the same source name; count them once.
    const source = `${score.team}:${score.statistics.Player || name}`;
    const existing = matches.get(source);
    if (existing && JSON.stringify(existing) !== JSON.stringify(score)) {
      // Conflicting saved aliases must not choose an arbitrary score.
      matches.set(`${source}:${name}`, score);
      candidates.set(key, matches);
      continue;
    }
    matches.set(source, score);
    candidates.set(key, matches);
  }
  for (const team of teams) {
    const info = team.weekInfo[week];
    const players: NflPlayer[] = [
      ...(team.rosteredPlayers || []),
      ...Object.values(info?.finalizedLineup || {}).flat(),
      ...Object.values(info?.scoringLineup || {}).flat(),
    ];
    for (const player of players) {
      if (!player.sanitizedName || result[player.sanitizedName]) continue;
      const matches = candidates.get(
        `${player.position}:${scoringName(player.sanitizedName)}`
      );
      if (matches?.size !== 1) continue;
      const score = [...matches.values()][0];
      if (scoringTeam(score.team) !== scoringTeam(player.team)) continue;
      result[player.sanitizedName] = score;
    }
  }
  return result;
};
