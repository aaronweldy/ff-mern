import { ChatMessage, DraftState, SyncAction } from "@ff-mern/ff-types";
import { useEffect } from "react";
import { SocketType } from "../../../Context/SocketContext";
import { useStore } from "../store";

export const useStateSyncListeners = (socket: SocketType) => {
  const { setDraftState, addMessage, setPlayersByTeam } = useStore((store) => ({
    setDraftState: store.setDraftState,
    addMessage: store.addMessage,
    setPlayersByTeam: store.setPlayersByTeam,
  }));

  useEffect(() => {
    if (socket) {
      const handleSync = (
        draftState: DraftState,
        action: Partial<SyncAction>
      ) => {
        console.log(draftState, action);
        setDraftState(draftState);
        if (action.message) {
          addMessage(action.message);
        }
        if (action.playersByTeam) {
          setPlayersByTeam(action.playersByTeam);
        }
      };
      socket.on("sync", handleSync);
      return () => {
        socket.off("sync", handleSync);
      };
    }
  });
};
