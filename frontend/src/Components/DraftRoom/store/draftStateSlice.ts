import { DraftState } from "@ff-mern/ff-types";
import { StoreSlice } from ".";

type DraftStateType = {
  state: DraftState | null;
};

export const createDraftStateSlice: StoreSlice<DraftStateType> = (set) => ({
  state: null,
  setDraftState: (newState: DraftState) => set({ state: newState }),
});
