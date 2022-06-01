import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../../Context/SocketContext";
import { useDraftSocket } from "./hooks/useDraftSocket";
import { useStore } from "./store";

export const DraftRoom = () => {
  const { id: roomId } = useParams() as { id: string };
  const { socket } = useSocket();
  const draftState = useStore((store) => store.state);
  console.log(draftState);
  useDraftSocket();
  useEffect(() => {
    socket?.emit("join room", roomId);
    return () => {
      if (socket) {
        socket.emit("leave room", roomId);
      }
    };
  }, [roomId, socket]);
  return <div>Testing Sockets</div>;
};
