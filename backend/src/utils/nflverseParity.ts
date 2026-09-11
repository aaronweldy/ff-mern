import {
  convertedScoringTypes,
  DatabasePlayer,
  ScoringSetting,
  SinglePosition,
  StatKey,
} from "@ff-mern/ff-types";
import { calculatePlayerScore } from "./scoring.js";

const scoreStatKeys = new Set<StatKey>([
  "team",
  "position",
  "G",
  ...Object.values(convertedScoringTypes).flatMap((positionStats) =>
    Object.values(positionStats).filter((key): key is StatKey => Boolean(key))
  ),
]);

export const nflverseParityFields = [...scoreStatKeys];

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
  const missingFromNflverse = legacyPlayers.filter(
    (player) => !(player in nflverseStats)
  );
  const missingFromLegacy = nflversePlayers.filter(
    (player) => !(player in legacyStats)
  );
  const statMismatches: StatMismatch[] = [];
  const scoreMismatches: ScoreMismatch[] = [];

  for (const player of legacyPlayers) {
    const nflverse = nflverseStats[player];
    if (!nflverse) continue;
    const legacy = legacyStats[player];
    for (const field of nflverseParityFields) {
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

    const position = legacy.position.toUpperCase();
    if (!scoringSettings || !isSinglePosition(position)) continue;
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
