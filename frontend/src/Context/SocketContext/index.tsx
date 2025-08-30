import { ClientToServerEvents, ServerToClientEvents } from "@ff-mern/ff-types";
import { useAuthIdToken } from "@react-query-firebase/auth";
import { IdTokenResult } from "firebase/auth";
import { createContext, useContext, useEffect, useReducer } from "react";
import { io, Socket } from "socket.io-client";
import { auth } from "../../firebase-config";

export type SocketType = Socket<
  ServerToClientEvents,
  ClientToServerEvents
> | null;
type State = { socket: SocketType };
type Action = { type: "set"; value: SocketType };
type Dispatch = (action: Action) => void;
type ProviderProps = { children: React.ReactNode };

const SocketContext = createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

const socketReducer = (state: State, action: Action) => {
  switch (action.type) {
    case "set":
      return { ...state, socket: action.value };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

export const SocketProvider = ({ children }: ProviderProps) => {
  const [state, dispatch] = useReducer(socketReducer, { socket: null });
  const tokenResult = useAuthIdToken<IdTokenResult>(["token"], auth);

  useEffect(() => {
    let socket: SocketType | null = null;
    if (tokenResult.isSuccess && import.meta.env.VITE_PUBLIC_URL) {
      socket = io(import.meta.env.VITE_PUBLIC_URL || "", {
        auth: { token: tokenResult?.data?.token },
      });
      dispatch({ type: "set", value: socket });
    }
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [dispatch, tokenResult.data, tokenResult.isSuccess]);

  return (
    <SocketContext.Provider value={{ state, dispatch }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return { socket: context.state.socket, dispatch: context.dispatch };
};
