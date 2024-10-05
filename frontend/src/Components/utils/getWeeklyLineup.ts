import {
  Team,
  LineupSettings,
  Position,
  SinglePosition,
  FinalizedPlayer,
  FinalizedLineup,
  AbbreviatedNflTeam,
  lineupSorter,
} from "@ff-mern/ff-types";

const getBench = (team: Team, notBenched: Set<string>) =>
  team.rosteredPlayers.reduce((acc, player) => {
    if (!notBenched.has(player.fullName)) {
      acc.push(
        new FinalizedPlayer(
          player.fullName,
          player.position,
          player.team,
          "bench"
        )
      );
    }
    return acc;
  }, [] as FinalizedPlayer[]);

const getPlayersInLineup = (lineup: FinalizedLineup) => {
  return Object.keys(lineup).reduce((acc, pos) => {
    if (pos === "bench") {
      return acc;
    }
    lineup[pos as Position].forEach((player) => {
      if (player.fullName !== "") {
        acc.add(player.fullName);
      }
    });
    return acc;
  }, new Set<string>());
};

export const getWeeklyLineup = (
  week: number = 1,
  team?: Team,
  lineupSettings?: LineupSettings
) => {
  if (!lineupSettings || !team) {
    return {} as FinalizedLineup;
  } else if (team.weekInfo[week].isSuperflex) {
    team.weekInfo[week].finalizedLineup["bench"] = getBench(
      team,
      getPlayersInLineup(team.weekInfo[week].finalizedLineup)
    );
    return team.weekInfo[week].finalizedLineup;
  }
  const notBenched = new Set<string>();
  const teamLatestLineup = team.weekInfo[week].finalizedLineup;
  const currentFinalizedLineup = (Object.keys(lineupSettings) as Position[])
    .sort(lineupSorter)
    .reduce((currLineup, pos) => {
      for (let i = 0; i < lineupSettings[pos]; i++) {
        if (pos in currLineup && i < currLineup[pos].length) {
          notBenched.add(currLineup[pos][i].fullName);
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
      if (pos in currLineup && currLineup[pos].length > lineupSettings[pos]) {
        while (currLineup[pos].length > lineupSettings[pos]) {
          currLineup[pos].pop();
        }
      }
      return currLineup;
    }, teamLatestLineup);
  currentFinalizedLineup["bench"] = getBench(team, notBenched);
  if (Object.keys(team.weekInfo[week].finalizedLineup).length === 0) {
    team.weekInfo[week].finalizedLineup = currentFinalizedLineup;
  }
  return currentFinalizedLineup;
};

export const findPlayerInLineup = (lineup: FinalizedLineup, player: FinalizedPlayer) => {
  for (const pos of Object.keys(lineup)) {
    const players = lineup[pos as Position];
    for (const p of players) {
      if (p.fullName === player.fullName && p.position === player.position && p.sanitizedName === player.sanitizedName && (p.lineup === 'bench' || p.lineup.indexOf(player.lineup) >= 0)) {
        return p;
      }
    }
  }
  return null;
}