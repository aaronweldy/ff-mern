import { SimplifiedTeamInfo, Team } from "../Team";
import { ProjectedPlayer } from "../Player";
import { LineupSettings } from "../League";
export type DraftType = "mock" | "official";
export type DraftPhase = "predraft" | "live" | "postdraft";
export type DraftSettings = {
    type: DraftType;
    draftId: string;
    numRounds: number;
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
    selections: Record<string, DraftPick[]>;
}
export type CurrentPick = {
    round: number;
    pickInRound: number;
};
export declare const getCurrentPickInfo: (state: DraftState, specificPick?: number) => {
    round: number;
    pickInRound: number;
};
export type PickOrder = "round-robin" | "snake";
export declare const createDraftStateForLeague: (lineupSettings: LineupSettings, leagueId: string, teams: Team[], availablePlayers: ProjectedPlayer[], draftId: string, settings?: DraftSettings) => DraftState;
