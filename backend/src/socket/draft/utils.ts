import {
  DraftState,
  ProjectedPlayer,
  DraftPick,
  LineupSettings,
  getEmptyLineupFromSettings,
  League,
  Position,
  positionTypes,
  TeamRoster,
} from "@ff-mern/ff-types";
import { db } from "../../config/firebase-config.js";

export const rebuildPlayersAndSelections = async (roomId: string) => {
  let availablePlayers: ProjectedPlayer[] = [];
  let selections: Record<string, DraftPick[]> = {};
  let draftState: DraftState;
  console.log(roomId);
  const draftRef = db.collection("drafts").doc(roomId);
  const [curState, players, selectionsRef] = await Promise.all([
    draftRef.get(),
    draftRef.collection("availablePlayers").orderBy("overall", "asc").get(),
    draftRef.collection("selections").get(),
  ]);
  if (curState.exists) {
    const league = (
      await db.collection("leagues").doc(curState.data().leagueId).get()
    ).data() as League;
    draftState = curState.data() as DraftState;
    const picksPerRound = draftState.settings.draftOrder.length;
    selectionsRef.forEach((pick) => {
      const pickData = pick.data();
      const round = Math.floor(pickData.pick / picksPerRound);
      const pickInRound = pickData.pick % picksPerRound;
      if (!selections[round]) {
        selections[round] = [];
      }
      selections[round][pickInRound] = pick.data() as DraftPick;
    });
    players.forEach((playerRef) => {
      availablePlayers.push(playerRef.data() as ProjectedPlayer);
    });
    return { draftState, availablePlayers, selections, league };
  } else {
    throw new Error("Draft does not exist");
  }
};

export const buildPlayersByTeam = (
  lineupSettings: LineupSettings,
  teamIds: string[],
  selections?: DraftPick[]
) => {
  const playersByTeam: Record<string, Record<Position, ProjectedPlayer[]>> = {};
  teamIds.forEach((teamId) => {
    playersByTeam[teamId] = getEmptyLineupFromSettings<ProjectedPlayer>(
      lineupSettings,
      { createEmptyPlayer: ProjectedPlayer["createEmptyPlayer"] }
    );
  });
  const remainingPlayersByTeam = teamIds.reduce<Record<string, LineupSettings>>(
    (acc, cur) => {
      acc[cur] = { ...lineupSettings };
      return acc;
    },
    {}
  );
  if (selections) {
    selections.forEach((selection) => {
      const teamId = selection.selectedBy.id;
      const player = selection.player;
      if (selection.player) {
        const availablePositions = positionTypes.filter((pos) =>
          pos.includes(player.position)
        );
        let foundPos = false;
        for (const pos of availablePositions) {
          const remainingAtPos = remainingPlayersByTeam[teamId][pos];
          if (remainingAtPos === 0) {
            continue;
          }
          playersByTeam[teamId][pos][lineupSettings[pos] - remainingAtPos] =
            player;
          remainingPlayersByTeam[teamId][pos] -= 1;
          foundPos = true;
          break;
        }
        if (!foundPos) {
          playersByTeam[teamId].bench.push(player);
        }
      }
    });
  }
  return playersByTeam;
};

export const addPlayerToTeam = (
  playersByTeam: Record<string, TeamRoster>,
  pick: DraftPick
) => {
  const teamId = pick.selectedBy.id;
  const player = pick.player;
  const availablePositions = positionTypes.filter((pos) =>
    pos.includes(player.position)
  );
  let foundPos = false;
  for (const pos of availablePositions) {
    for (let i = 0; i < playersByTeam[teamId][pos].length; i++) {
      const playerAtInd = playersByTeam[teamId][pos][i];
      if (!playerAtInd.fullName) {
        playersByTeam[teamId][pos][i] = player;
        foundPos = true;
        break;
      }
    }
    if (foundPos) {
      break;
    }
  }
};

export const linearizeSelections = (selections: Record<string, DraftPick[]>) =>
  Object.keys(selections).reduce<DraftPick[]>((acc, round) => {
    return acc.concat(selections[round]);
  }, []);
