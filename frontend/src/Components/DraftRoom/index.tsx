import { ConnectionAction } from "@ff-mern/ff-types";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useSocket } from "../../Context/SocketContext";

type ConnectedUser = {
  id: string;
  email: string;
};

export const DraftRoom = () => {
  const { id: roomId } = useParams() as { id: string };
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const { socket } = useSocket();
  useEffect(() => {
    if (socket) {
      console.log(connectedUsers);
      const handleUserConnection = (action: ConnectionAction) => {
        if (action.type === "connect") {
          toast.success(`${action.userEmail} has connected!`, {
            position: toast.POSITION.TOP_CENTER,
          });
          setConnectedUsers(() => [
            ...connectedUsers,
            { id: action.userId, email: action.userEmail },
          ]);
        } else if (action.type === "disconnect") {
          toast.error(`${action.userEmail} has disconnected!`, {
            position: toast.POSITION.TOP_CENTER,
          });
          setConnectedUsers(() =>
            connectedUsers.filter((user) => user.id !== action.userId)
          );
        }
      };
      socket.on("user connection", handleUserConnection);
      return () => {
        socket.off("user connection", handleUserConnection);
      };
    }
  }, [socket, connectedUsers]);
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
