import create, { GetState, SetState } from "zustand";
import { createChatSlice } from "./chatSlice";
import { createDraftStateSlice } from "./draftStateSlice";
import { createSelectedPlayerSlice } from "./selectedPlayerSlice";
import { createUserSlice } from "./userSlice";

type StateFromFunctions<T extends [...any]> = T extends [infer F, ...infer R]
  ? F extends (...args: any) => object
    ? StateFromFunctions<R> & ReturnType<F>
    : unknown
  : unknown;

type State = StateFromFunctions<
  [
    typeof createDraftStateSlice,
    typeof createUserSlice,
    typeof createSelectedPlayerSlice,
    typeof createChatSlice
  ]
>;

export type StoreSlice<T extends object, E extends object = T> = (
  set: SetState<E extends T ? E : E & T>,
  get: GetState<E extends T ? E : E & T>
) => T;

const createRootSlice = (set: SetState<any>, get: GetState<any>) => ({
  ...createDraftStateSlice(set, get),
  ...createUserSlice(set, get),
  ...createSelectedPlayerSlice(set, get),
  ...createChatSlice(set, get),
});

export const useStore = create<State>(createRootSlice);
