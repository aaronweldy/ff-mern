import { ChatMessage } from "@ff-mern/ff-types";
import { StoreSlice } from ".";

type ChatSliceType = {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
};

export const createChatSlice: StoreSlice<ChatSliceType> = (set) => ({
  messages: [],
  addMessage: (message: ChatMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),
});
