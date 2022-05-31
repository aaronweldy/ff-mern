import { ConnectionAction } from "@ff-mern/ff-types";
import { StoreSlice } from ".";

type ConnectedUser = {
  id: string;
  email: string;
};

type UserSliceType = {
  connectedUsers: ConnectedUser[];
  addUser: (newUser: ConnectionAction) => void;
  removeUser: (user: ConnectionAction) => void;
};

export const createUserSlice: StoreSlice<UserSliceType> = (set) => ({
  connectedUsers: [],
  addUser: (newUser: ConnectionAction) =>
    set((prevState) => ({
      connectedUsers: [
        ...prevState.connectedUsers,
        { id: newUser.userId, email: newUser.userEmail },
      ],
    })),
  removeUser: (user: ConnectionAction) =>
    set((prevState) => ({
      connectedUsers: prevState.connectedUsers.filter(
        (connectedUser) => connectedUser.id !== user.userId
      ),
    })),
});
