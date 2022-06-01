import { DraftState } from "@ff-mern/ff-types";
import { StoreSlice } from ".";

type DraftStateType = {
  state: DraftState | null;
  setDraftState: (draftState: DraftState) => void;
};

export const createDraftStateSlice: StoreSlice<DraftStateType> = (set) => ({
  state: null,
  setDraftState: (newState: DraftState) => set({ state: newState }),
});
