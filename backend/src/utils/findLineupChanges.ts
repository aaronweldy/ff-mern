import {
  FinalizedLineup,
  FinalizedPlayer,
  Position,
  TeamWeekInfo,
  Week,
} from "@ff-mern/ff-types";

export type LineupDiff = {
  week: Week;
  newPlayer?: FinalizedPlayer;
  oldPlayer?: FinalizedPlayer;
  position: Position;
};

// Compare both sides: a removed week/slot and a newly filled slot are changes too.
export const findLineupChanges = (
  prevWeekInfo: TeamWeekInfo[],
  newWeekInfo: TeamWeekInfo[]
): LineupDiff[] => {
  const diff: LineupDiff[] = [];
  for (
    let week = 0;
    week < Math.max(prevWeekInfo.length, newWeekInfo.length);
    week++
  ) {
    const previous: Partial<FinalizedLineup> =
      prevWeekInfo[week]?.finalizedLineup ?? {};
    const next: Partial<FinalizedLineup> =
      newWeekInfo[week]?.finalizedLineup ?? {};
    const positions = new Set([...Object.keys(previous), ...Object.keys(next)]);
    for (const pos of positions as Set<Position>) {
      if (pos === "bench") continue;
      const oldPlayers = previous[pos] ?? [];
      const newPlayers = next[pos] ?? [];
      for (
        let index = 0;
        index < Math.max(oldPlayers.length, newPlayers.length);
        index++
      ) {
        const oldPlayer = oldPlayers[index];
        const newPlayer = newPlayers[index];
        const fields = [
          "fullName",
          "sanitizedName",
          "position",
          "team",
          "lineup",
          "backup",
        ] as const;
        if (
          fields.some(
            (field) => (oldPlayer?.[field] ?? "") !== (newPlayer?.[field] ?? "")
          )
        ) {
          diff.push({
            week: String(week) as Week,
            oldPlayer,
            newPlayer,
            position: pos,
          });
        }
      }
    }
  }
  return diff;
};
