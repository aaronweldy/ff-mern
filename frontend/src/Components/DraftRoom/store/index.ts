import create, { GetState, SetState } from "zustand";
import { createChatSlice } from "./chatSlice";
import { createDraftStateSlice } from "./draftStateSlice";
import { createSelectedPlayerSlice } from "./selectedPlayerSlice";
import { createUserSlice } from "./userSlice";
import { persist } from "zustand/middleware";

export type StoreSlice<T extends object, E extends object = T> = (
  set: SetState<E extends T ? E : E & T>,
  get: GetState<E extends T ? E : E & T>
) => T;

const createRootSlice = persist((set: SetState<any>, get: GetState<any>) => ({
  ...createDraftStateSlice(set, get),
  ...createUserSlice(set, get),
  ...createSelectedPlayerSlice(set, get),
  ...createChatSlice(set, get),
}));

export const useStore = create(createRootSlice);
