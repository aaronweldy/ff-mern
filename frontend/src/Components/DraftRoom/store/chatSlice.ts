import { ChatMessage } from "@ff-mern/ff-types";
import { StoreSlice } from ".";

type ChatSliceType = {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
};

export const createChatSlice: StoreSlice<ChatSliceType> = (set) => ({
  messages: [],
  addMessage: (message: ChatMessage) =>
    set((state) => {
      const curMessages = [...state.messages];
      if (curMessages.length > 200) {
        curMessages.shift();
      }
      curMessages.push(message);
      return { messages: curMessages };
    }),
});
