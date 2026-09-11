import { convertedScoringTypes, } from "@ff-mern/ff-types";
import { calculatePlayerScore } from "./scoring.js";
const scoreStatKeys = new Set([
    "team",
    "position",
    "G",
    ...Object.values(convertedScoringTypes).flatMap((positionStats) => Object.values(positionStats).filter((key) => Boolean(key))),
]);
export const nflverseParityFields = [...scoreStatKeys];
const valuesMatch = (legacy, nflverse) => {
    const legacyNumber = Number(legacy);
    const nflverseNumber = Number(nflverse);
    if (Number.isFinite(legacyNumber) && Number.isFinite(nflverseNumber)) {
        return Math.abs(legacyNumber - nflverseNumber) < 0.0001;
    }
    return legacy === nflverse;
};
const isSinglePosition = (value) => value === "QB" || value === "RB" || value === "WR" || value === "TE" || value === "K";
/**
 * Compares the current FantasyPros-shaped cache with normalized nflverse data.
 * It is intentionally side-effect free so the command-line audit and tests use
 * the same comparison rules.
 */
export const compareNflverseStats = (legacyStats, nflverseStats, scoringSettings) => {
    const legacyPlayers = Object.keys(legacyStats).sort();
    const nflversePlayers = Object.keys(nflverseStats).sort();
    const missingFromNflverse = legacyPlayers.filter((player) => !(player in nflverseStats));
    const missingFromLegacy = nflversePlayers.filter((player) => !(player in legacyStats));
    const statMismatches = [];
    const scoreMismatches = [];
    for (const player of legacyPlayers) {
        const nflverse = nflverseStats[player];
        if (!nflverse)
            continue;
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
        if (!scoringSettings || !isSinglePosition(position))
            continue;
        const legacyScore = calculatePlayerScore(legacy, position, scoringSettings).totalPoints;
        const nflverseScore = calculatePlayerScore(nflverse, position, scoringSettings).totalPoints;
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
//# sourceMappingURL=nflverseParity.js.map