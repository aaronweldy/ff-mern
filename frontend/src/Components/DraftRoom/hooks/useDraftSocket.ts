import { useSocket } from "../../../Context/SocketContext";
import { useUserListeners } from "./useUserListeners";

export const useDraftSocket = () => {
  const { socket } = useSocket();
  useUserListeners(socket);
};
