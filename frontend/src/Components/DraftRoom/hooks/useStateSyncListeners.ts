import { DraftState } from "@ff-mern/ff-types";
import { useEffect } from "react";
import { SocketType } from "../../../Context/SocketContext";
import { useStore } from "../store";

export const useStateSyncListeners = (socket: SocketType) => {
  const setDraftState = useStore((store) => store.setDraftState);
  useEffect(() => {
    if (socket) {
      const handleDraftState = (draftState: DraftState) => {
        setDraftState(draftState);
      };
      socket.on("sync", handleDraftState);
      return () => {
        socket.off("sync", handleDraftState);
      };
    }
  });
};
