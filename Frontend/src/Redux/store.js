import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import tutorReducer from './tutorSlice';
import categoryReducer from './categorySlice'
import tutorCoursesReducer from './tutorCourseSlice'
export const store = configureStore({
  reducer: {
    users: userReducer,
    tutors:tutorReducer,
    category: categoryReducer,
    tutorCourses:tutorCoursesReducer,
  },
});
