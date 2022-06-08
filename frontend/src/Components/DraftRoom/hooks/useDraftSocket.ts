import { useSocket } from "../../../Context/SocketContext";
import { useMessageListeners } from "./useMessageListeners";
import { useStateSyncListeners } from "./useStateSyncListeners";
import { useUserListeners } from "./useUserListeners";

export const useDraftSocket = () => {
  const { socket } = useSocket();
  useUserListeners(socket);
  useStateSyncListeners(socket);
  useMessageListeners(socket);
};
