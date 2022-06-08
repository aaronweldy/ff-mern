import { ChatMessage, DraftState } from "@ff-mern/ff-types";
import { useEffect } from "react";
import { SocketType } from "../../../Context/SocketContext";
import { useStore } from "../store";

export const useStateSyncListeners = (socket: SocketType) => {
  const { setDraftState, addMessage } = useStore((store) => ({
    setDraftState: store.setDraftState,
    addMessage: store.addMessage,
  }));

  useEffect(() => {
    if (socket) {
      const handleDraftState = (
        draftState: DraftState,
        message?: ChatMessage
      ) => {
        console.log(draftState, message);
        setDraftState(draftState);
        if (message) {
          addMessage(message);
        }
      };
      socket.on("sync", handleDraftState);
      return () => {
        socket.off("sync", handleDraftState);
      };
    }
  });
};
