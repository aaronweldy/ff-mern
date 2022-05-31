import { ProjectedPlayer } from "../API";
import { RosteredPlayer } from "../Player";

export type DraftType = "mock" | "official";
export type DraftPhase = "predraft" | "live" | "postdraft";

export type DraftSettings = {
  type: DraftType;
  draftId: string;
  numRounds: number;
};

export type DraftPick = {
  pick: number;
  // Id of the team that selected this player
  selectedBy: string;
  player: ProjectedPlayer;
};

export interface DraftState {
  settings: DraftSettings;
  currentPick: number;
  phase: DraftPhase;
  availablePlayers: ProjectedPlayer[];
  selections: DraftPick[];
}
