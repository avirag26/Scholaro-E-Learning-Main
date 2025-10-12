import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import tutorReducer from './tutorSlice';

export const store = configureStore({
  reducer: {
    users: userReducer,
    tutors:tutorReducer,
  },
});
