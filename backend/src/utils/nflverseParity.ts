import {
  convertedScoringTypes,
  DatabasePlayer,
  ScoringSetting,
  SinglePosition,
  StatKey,
} from "@ff-mern/ff-types";
import { calculatePlayerScore } from "./scoring.js";

const commonParityFields = new Set<StatKey>([
  "team",
  "position",
  "G",
]);

export const nflverseParityFields = [...commonParityFields];

export type StatMismatch = {
  player: string;
  field: StatKey;
  legacy: string;
  nflverse: string;
};

export type ScoreMismatch = {
  player: string;
  legacy: number;
  nflverse: number;
  delta: number;
};

export type NflverseParityReport = {
  legacyPlayerCount: number;
  nflversePlayerCount: number;
  missingFromNflverse: string[];
  missingFromLegacy: string[];
  statMismatches: StatMismatch[];
  scoreMismatches: ScoreMismatch[];
};

const valuesMatch = (legacy: string, nflverse: string): boolean => {
  const legacyNumber = Number(legacy);
  const nflverseNumber = Number(nflverse);
  if (Number.isFinite(legacyNumber) && Number.isFinite(nflverseNumber)) {
    return Math.abs(legacyNumber - nflverseNumber) < 0.0001;
  }
  return legacy === nflverse;
};

const isSinglePosition = (value: string): value is SinglePosition =>
  value === "QB" || value === "RB" || value === "WR" || value === "TE" || value === "K";

const playerNameAliases: Record<string, string> = {
  "drew ogletree": "andrew ogletree",
  "joshua palmer": "josh palmer",
  "hollywood brown": "marquise brown",
  "tre' harris": "tre harris",
};

export const canonicalizePlayerName = (name: string): string => {
  const withoutSuffix = name.replace(/\s+(?:jr|sr|ii|iii|iv|v)$/i, "").trim();
  return playerNameAliases[withoutSuffix] || withoutSuffix;
};

const fieldsForPosition = (position: SinglePosition): StatKey[] => [
  ...commonParityFields,
  ...Object.values(convertedScoringTypes[position]).filter(
    (key): key is StatKey => Boolean(key)
  ),
];

/**
 * Compares the current FantasyPros-shaped cache with normalized nflverse data.
 * It is intentionally side-effect free so the command-line audit and tests use
 * the same comparison rules.
 */
export const compareNflverseStats = (
  legacyStats: Record<string, DatabasePlayer>,
  nflverseStats: Record<string, DatabasePlayer>,
  scoringSettings?: ScoringSetting[]
): NflverseParityReport => {
  const legacyPlayers = Object.keys(legacyStats).sort();
  const nflversePlayers = Object.keys(nflverseStats).sort();
  const nflverseByCanonicalName = new Map(
    nflversePlayers.map((player) => [canonicalizePlayerName(player), player])
  );
  const legacyByCanonicalName = new Map(
    legacyPlayers.map((player) => [canonicalizePlayerName(player), player])
  );
  const missingFromNflverse = legacyPlayers.filter(
    (player) => !nflverseByCanonicalName.has(canonicalizePlayerName(player))
  );
  const missingFromLegacy = nflversePlayers.filter(
    (player) => !legacyByCanonicalName.has(canonicalizePlayerName(player))
  );
  const statMismatches: StatMismatch[] = [];
  const scoreMismatches: ScoreMismatch[] = [];

  for (const player of legacyPlayers) {
    const nflversePlayer = nflverseByCanonicalName.get(
      canonicalizePlayerName(player)
    );
    if (!nflversePlayer) continue;
    const nflverse = nflverseStats[nflversePlayer];
    const legacy = legacyStats[player];
    const position = legacy.position.toUpperCase();
    if (!isSinglePosition(position)) continue;
    for (const field of fieldsForPosition(position)) {
      const legacyValue = legacy[field] || "0";
      const nflverseValue = nflverse[field] || "0";
      if (!valuesMatch(legacyValue, nflverseValue)) {
        statMismatches.push({
          player,
          field,
          legacy: legacyValue,
          nflverse: nflverseValue,
        });
      }
    }

    if (!scoringSettings) continue;
    const legacyScore = calculatePlayerScore(
      legacy,
      position,
      scoringSettings
    ).totalPoints;
    const nflverseScore = calculatePlayerScore(
      nflverse,
      position,
      scoringSettings
    ).totalPoints;
    if (Math.abs(legacyScore - nflverseScore) >= 0.0001) {
      scoreMismatches.push({
        player,
        legacy: legacyScore,
        nflverse: nflverseScore,
        delta: nflverseScore - legacyScore,
      });
    }
  }

  return {
    legacyPlayerCount: legacyPlayers.length,
    nflversePlayerCount: nflversePlayers.length,
    missingFromNflverse,
    missingFromLegacy,
    statMismatches,
    scoreMismatches,
  };
};
