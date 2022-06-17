import { DraftState, TeamRoster } from "@ff-mern/ff-types";
import { StoreSlice } from ".";
import { SelectedPlayerType } from "./selectedPlayerSlice";

type DraftStateType = {
  state: DraftState | null;
  playersByTeam: Record<string, TeamRoster> | null;
  setDraftState: (draftState: DraftState) => void;
  setPlayersByTeam: (playersByTeam: Record<string, TeamRoster>) => void;
};

export const createDraftStateSlice: StoreSlice<
  DraftStateType,
  SelectedPlayerType
> = (set) => ({
  state: null,
  playersByTeam: null,
  setDraftState: (newState: DraftState) =>
    set({ state: newState, player: null }),
  setPlayersByTeam: (playersByTeam: Record<string, TeamRoster>) =>
    set({ playersByTeam }),
});
