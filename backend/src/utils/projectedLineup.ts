import {
  FinalizedLineup,
  FinalizedPlayer,
  RosteredPlayer,
  LineupSettings,
  Position,
  lineupSorter,
} from "@ff-mern/ff-types";
import { projectionPlayerKey } from "./sleeperProjections.js";

export const buildProjectedLineup = (
  roster: RosteredPlayer[],
  previous: FinalizedLineup,
  projections: Record<string, number>,
  settings?: LineupSettings
): FinalizedLineup => {
  const lineup = {} as FinalizedLineup;
  const used = new Set<string>();
  const slots = Object.keys(previous).some((pos) => pos !== "bench")
    ? Object.fromEntries(
        Object.entries(previous).map(([pos, players]) => [pos, players.length])
      )
    : settings;
  if (
    !slots ||
    !Object.keys(slots).some(
      (pos) => pos !== "bench" && slots[pos as Position] > 0
    )
  ) {
    throw new Error("No starting lineup slots are configured.");
  }
  // Supported flex eligibility sets are nested. Fill restricted slots before
  // broader flex slots so a flexible slot cannot consume a required starter.
  for (const pos of (Object.keys(slots) as Position[]).sort(lineupSorter)) {
    if (pos === "bench") continue;
    const candidates = roster
      .filter((player) => {
        const key = projectionPlayerKey(player.fullName, player.position);
        return (
          pos.split("/").includes(player.position) &&
          !used.has(key) &&
          Number.isFinite(projections[key])
        );
      })
      .sort(
        (a, b) =>
          projections[projectionPlayerKey(b.fullName, b.position)] -
          projections[projectionPlayerKey(a.fullName, a.position)]
      );
    if (candidates.length < slots[pos]) {
      throw new Error(
        `Not enough rostered players with weekly projections to fill ${pos}. Your lineup has not been changed.`
      );
    }
    lineup[pos] = candidates.slice(0, slots[pos]).map((player) => {
      used.add(projectionPlayerKey(player.fullName, player.position));
      const old = previous[pos]?.find(
        (p) => p.sanitizedName === player.sanitizedName
      );
      return {
        fullName: player.fullName,
        sanitizedName: player.sanitizedName,
        position: player.position,
        team: player.team,
        lineup: pos,
        backup: old?.backup ?? "",
      } as FinalizedPlayer;
    });
  }
  lineup.bench = roster
    .filter(
      (player) =>
        !used.has(projectionPlayerKey(player.fullName, player.position))
    )
    .map(
      (player) =>
        ({ ...player, lineup: "bench", backup: "" } as FinalizedPlayer)
    );
  return lineup;
};
