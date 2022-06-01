import { ConnectionAction } from "@ff-mern/ff-types";
import { useEffect } from "react";
import { toast } from "react-toastify";
import shallow from "zustand/shallow";
import { SocketType } from "../../../Context/SocketContext";
import { useStore } from "../store";

export const useUserListeners = (socket: SocketType) => {
  const { connectedUsers, addUser, removeUser } = useStore(
    (state) => ({
      connectedUsers: state.connectedUsers,
      addUser: state.addUser,
      removeUser: state.removeUser,
    }),
    shallow
  );
  useEffect(() => {
    if (socket) {
      const handleUserConnection = (action: ConnectionAction) => {
        if (action.type === "connect") {
          toast.success(`${action.userEmail} has connected!`, {
            position: toast.POSITION.TOP_CENTER,
            autoClose: 2000,
          });
          addUser(action);
        } else if (action.type === "disconnect") {
          toast.error(`${action.userEmail} has disconnected!`, {
            position: toast.POSITION.TOP_CENTER,
            autoClose: 2000,
          });
          removeUser(action);
        }
      };
      socket.on("user connection", handleUserConnection);
      return () => {
        socket.off("user connection", handleUserConnection);
      };
    }
  }, [socket, addUser, removeUser, connectedUsers]);
};
