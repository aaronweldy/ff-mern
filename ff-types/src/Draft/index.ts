import { mapTeamsToIds, SimplifiedTeamInfo, Team } from "../Team";
import { ProjectedPlayer } from "../Player";
import { getNumPlayersFromLineupSettings, LineupSettings } from "../League";

export type DraftType = "mock" | "official";
export type DraftPhase = "predraft" | "live" | "postdraft";

export type DraftSettings = {
  type: DraftType;
  draftId: string;
  numRounds: number;
  // List of team IDs in the order of the draft
  draftOrder: string[];
  pickOrder: PickOrder;
};

export type DraftPick = {
  pick: number;
  selectedBy: SimplifiedTeamInfo;
  player: ProjectedPlayer | null;
};

export interface DraftState {
  settings: DraftSettings;
  leagueId: string;
  currentPick: number;
  phase: DraftPhase;
  availablePlayers: ProjectedPlayer[];
  // Mapping from round to draft picks at each round.
  selections: Record<string, DraftPick[]>;
}

export type CurrentPick = {
  round: number;
  pickInRound: number;
};

export const getCurrentPickInfo = (
  state: DraftState,
  specificPick?: number
) => {
  const { settings, currentPick } = state;
  if (!specificPick) {
    specificPick = currentPick;
  }
  const round = Math.floor(specificPick / settings.draftOrder.length);
  const pickInRound = specificPick % settings.draftOrder.length;
  return {
    round,
    pickInRound,
  };
};

export type PickOrder = "round-robin" | "snake";

const createPickOrderWithTeams = (
  settings: DraftSettings,
  teamsMap: Record<string, Team>
) => {
  const { draftOrder, pickOrder, numRounds } = settings;
  const reversedDraftOrder = draftOrder.slice().reverse();
  const numPicks = numRounds * draftOrder.length;
  const picks: Record<string, DraftPick[]> = {};
  let expandedPickOrder: string[][] = [];
  for (let i = 0; i < numRounds; ++i) {
    picks[i] = new Array<null>(draftOrder.length).fill(null);
    if (pickOrder === "snake" && i % 2 === 1) {
      expandedPickOrder.push(reversedDraftOrder.slice());
    } else {
      expandedPickOrder.push(draftOrder.slice());
    }
  }
  let curPick = 0;
  let curRound = 0;
  while (curPick < numPicks) {
    const pickInd = curRound === 0 ? curPick : curPick % draftOrder.length;
    const team = teamsMap[expandedPickOrder[curRound][pickInd]];
    picks[curRound][pickInd] = {
      pick: curPick,
      selectedBy: {
        owner: team.owner,
        ownerName: team.ownerName,
        name: team.name,
        id: team.id,
      },
      player: null,
    };
    curPick++;
    if (curPick % draftOrder.length === 0) {
      curRound++;
    }
  }
  return picks;
};

export const createDraftStateForLeague = (
  lineupSettings: LineupSettings,
  leagueId: string,
  teams: Team[],
  availablePlayers: ProjectedPlayer[],
  draftId: string,
  settings: DraftSettings = null
): DraftState => {
  if (!settings) {
    settings = {
      type: "official",
      draftId,
      numRounds: getNumPlayersFromLineupSettings(lineupSettings),
      pickOrder: "snake",
      draftOrder: teams.map((team) => team.id),
    };
  }
  return {
    settings,
    leagueId: leagueId,
    currentPick: 0,
    phase: "predraft",
    availablePlayers,
    selections: createPickOrderWithTeams(settings, mapTeamsToIds(teams)),
  };
};
