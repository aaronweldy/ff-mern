import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    loggedIn: false,
    currUser: null,
  },
  reducers: {
    login: (state) => {
      state.loggedIn = true;
    },
    logout: (state) => {
      state.loggedIn = false;
    },
    setUser: (state, action) => {
      state.currUser = action.payload;
    },
  },
});

export const selectStatus = (state) => state.user.loggedIn;

export const selectUser = (state) => state.user.currUser;

export const { login, logout, setUser } = userSlice.actions;

export default userSlice.reducer;
