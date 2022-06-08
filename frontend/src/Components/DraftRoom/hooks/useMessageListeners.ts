import { ChatMessage } from "@ff-mern/ff-types";
import { useEffect } from "react";
import { SocketType } from "../../../Context/SocketContext";
import { useStore } from "../store";

export const useMessageListeners = (socket: SocketType) => {
  const addMessage = useStore((store) => store.addMessage);
  useEffect(() => {
    if (socket) {
      socket.on("newMessage", (message: ChatMessage) => {
        addMessage(message);
      });
      return () => {
        socket.off("newMessage");
      };
    }
  }, [socket]);
};
