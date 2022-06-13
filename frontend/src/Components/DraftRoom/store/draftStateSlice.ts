import { DraftState, TeamRoster } from "@ff-mern/ff-types";
import { StoreSlice } from ".";

type DraftStateType = {
  state: DraftState | null;
  playersByTeam: Record<string, TeamRoster> | null;
  setDraftState: (draftState: DraftState) => void;
  setPlayersByTeam: (playersByTeam: Record<string, TeamRoster>) => void;
};

export const createDraftStateSlice: StoreSlice<DraftStateType> = (set) => ({
  state: null,
  playersByTeam: null,
  setDraftState: (newState: DraftState) => set({ state: newState }),
  setPlayersByTeam: (playersByTeam: Record<string, TeamRoster>) =>
    set({ playersByTeam }),
});
