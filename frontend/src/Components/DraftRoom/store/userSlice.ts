import { ConnectionAction } from "@ff-mern/ff-types";
import { StoreSlice } from ".";

type ConnectedUser = {
  id: string;
  email: string;
};

type UserSliceType = {
  connectedUsers: ConnectedUser[];
  userIsCommissioner: boolean;
  setIsCommissioner: () => void;
  addUser: (newUser: ConnectionAction) => void;
  removeUser: (user: ConnectionAction) => void;
};

export const createUserSlice: StoreSlice<UserSliceType> = (set) => ({
  connectedUsers: [],
  userIsCommissioner: false,
  setIsCommissioner: () => set(() => ({ userIsCommissioner: true })),
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
