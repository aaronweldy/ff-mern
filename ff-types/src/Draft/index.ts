import { Team } from "../Team";
import { ProjectedPlayer } from "../API";
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
  // Id of the team that selected this player
  selectedBy: string;
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

export type PickOrder = "round-robin" | "snake";

const createPickOrderWithTeams = (settings: DraftSettings) => {
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
    picks[curRound][pickInd] = {
      pick: curPick,
      selectedBy: expandedPickOrder[curRound][pickInd],
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
    selections: createPickOrderWithTeams(settings),
  };
};
