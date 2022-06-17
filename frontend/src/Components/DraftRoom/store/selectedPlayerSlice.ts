import { ProjectedPlayer } from "@ff-mern/ff-types";
import { StoreSlice } from ".";

export type SelectedPlayerType = {
  player: ProjectedPlayer | null;
  setSelectedPlayer: (player: ProjectedPlayer | null) => void;
};

export const createSelectedPlayerSlice: StoreSlice<SelectedPlayerType> = (
  set
) => ({
  player: null,
  setSelectedPlayer: (player: ProjectedPlayer | null) => set({ player }),
});
