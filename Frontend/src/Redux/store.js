import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import tutorReducer from './tutorSlice';
import categoryReducer from './categorySlice';
import courseReducer from './courseSlice';
import lessonReducer from './lessonSlice';
import userCourseReducer from './userCourseSlice';

export const store = configureStore({
  reducer: {
    users: userReducer,
    tutors: tutorReducer,
    category: categoryReducer,
    courses: courseReducer,
    lessons: lessonReducer,
    userCourses: userCourseReducer,
  },
});
