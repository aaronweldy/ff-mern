import {
  Team,
  LineupSettings,
  Position,
  SinglePosition,
  FinalizedPlayer,
  FinalizedLineup,
  AbbreviatedNflTeam,
} from "@ff-mern/ff-types";
import { lineupSorter } from "../../constants";

export const getWeeklyLineup = (
  week: number = 1,
  team?: Team,
  lineupSettings?: LineupSettings
) => {
  if (!lineupSettings || !team) {
    return {} as FinalizedLineup;
  }
  const notBenched = new Set<string>();
  const teamLatestLineup = team.weekInfo[week].finalizedLineup;
  const currentFinalizedLineup = (Object.keys(lineupSettings) as Position[])
    .sort(lineupSorter)
    .reduce((currLineup, pos) => {
      for (let i = 0; i < lineupSettings[pos]; i++) {
        if (pos in teamLatestLineup && i < teamLatestLineup[pos].length) {
          notBenched.add(teamLatestLineup[pos][i].name);
          continue;
        } else {
          if (!currLineup[pos]) {
            currLineup[pos] = [];
          }
          currLineup[pos].push(
            new FinalizedPlayer(
              "",
              pos.split("/")[0] as SinglePosition,
              "" as AbbreviatedNflTeam,
              pos
            )
          );
        }
      }
      return currLineup;
    }, teamLatestLineup);
  currentFinalizedLineup["bench"] = team.rosteredPlayers.reduce(
    (acc, player) => {
      if (!notBenched.has(player.name)) {
        acc.push(
          new FinalizedPlayer(
            player.name,
            player.position,
            player.team,
            "bench"
          )
        );
      }
      return acc;
    },
    [] as FinalizedPlayer[]
  );
  return currentFinalizedLineup;
};
