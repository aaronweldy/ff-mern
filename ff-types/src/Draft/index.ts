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
};

export type DraftPick = {
  pick: number;
  // Id of the team that selected this player
  selectedBy: string;
  player: ProjectedPlayer;
};

export interface DraftState {
  settings: DraftSettings;
  leagueId: string;
  currentPick: number;
  phase: DraftPhase;
  availablePlayers: ProjectedPlayer[];
  selections: DraftPick[];
}

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
      draftOrder: teams.map((team) => team.id),
    };
  }
  return {
    settings,
    leagueId: leagueId,
    currentPick: 0,
    phase: "predraft",
    availablePlayers,
    selections: Array(settings.numRounds * teams.length).fill(null),
  };
};
