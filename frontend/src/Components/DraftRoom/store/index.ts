import create, { GetState, SetState } from "zustand";
import { createDraftStateSlice } from "./draftStateSlice";
import { createUserSlice } from "./userSlice";

export type StoreSlice<T extends object, E extends object = T> = (
  set: SetState<E extends T ? E : E & T>,
  get: GetState<E extends T ? E : E & T>
) => T;

const createRootSlice = (set: SetState<any>, get: GetState<any>) => ({
  ...createDraftStateSlice(set, get),
  ...createUserSlice(set, get),
});

export const useStore = create(createRootSlice);
