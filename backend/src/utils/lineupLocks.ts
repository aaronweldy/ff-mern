import {
  AbbreviationToFullTeam,
  FinalizedPlayer,
  NFLSchedule,
  NflPlayer,
  Team,
  Week,
} from "@ff-mern/ff-types";
import { findLineupChanges } from "./findLineupChanges.js";

export class TeamUpdateError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const assertLineupUnlocked = (
  previous: Team,
  next: Team,
  schedule: NFLSchedule,
  isCommissioner: boolean,
  now = Date.now()
): void => {
  if (isCommissioner) return;
  const storedPlayers: NflPlayer[] = [
    ...previous.rosteredPlayers,
    ...previous.weekInfo.flatMap((info) =>
      Object.values(info.finalizedLineup).flat()
    ),
  ];
  const played = (player: NflPlayer | undefined, week: Week): boolean => {
    if (!player?.fullName || player.team === "None") return false;
    const kickoff =
      schedule[AbbreviationToFullTeam[player.team]]?.[week]?.gameTime;
    return !!kickoff && now >= new Date(kickoff).getTime();
  };
  // Check stored identities as well as the submitted value: changing an NFL
  // team or position in a request must not unlock an already-started player.
  const affectedPlayers = (player?: FinalizedPlayer): NflPlayer[] =>
    player
      ? [
          player,
          ...storedPlayers.filter(
            (stored) =>
              stored.fullName === player.fullName ||
              stored.fullName === player.backup
          ),
        ]
      : [];

  for (const change of findLineupChanges(previous.weekInfo, next.weekInfo)) {
    const affected = [
      ...affectedPlayers(change.oldPlayer),
      ...affectedPlayers(change.newPlayer),
    ];
    if (affected.some((player) => played(player, change.week))) {
      throw new TeamUpdateError(
        400,
        "Cannot modify lineup for players whose games have already started. Your lineup has not been changed."
      );
    }
  }
  // Superflex changes scoring eligibility even if the submitted slots are identical.
  previous.weekInfo.forEach((info, week) => {
    if (!!info.isSuperflex === !!next.weekInfo[week]?.isSuperflex) return;
    if (
      Object.entries(info.finalizedLineup).some(
        ([pos, players]) =>
          pos !== "bench" &&
          players.some((player) => played(player, String(week) as Week))
      )
    ) {
      throw new TeamUpdateError(
        400,
        "Cannot change lineup settings after a starter's game has begun. Your lineup has not been changed."
      );
    }
  });
};
