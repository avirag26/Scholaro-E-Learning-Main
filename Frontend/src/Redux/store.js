import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import currentUserReducer from "./currentUserSlice";
import currentTutorReducer from "./currentTutorSlice";
import currentAdminReducer from "./currentAdminSlice";
import tutorReducer from './tutorSlice';
import categoryReducer from './categorySlice';
import courseReducer from './courseSlice';
import lessonReducer from './lessonSlice';
import userCourseReducer from './userCourseSlice';
import cartReducer from './cartSlice';
import wishlistReducer from './wishlistSlice';
import paymentReducer from './paymentSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    users: userReducer,
    currentUser: currentUserReducer,
    currentTutor: currentTutorReducer,
    currentAdmin: currentAdminReducer,
    tutors: tutorReducer,
    category: categoryReducer,
    courses: courseReducer,
    lessons: lessonReducer,
    userCourses: userCourseReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    payment: paymentReducer,
    chat: chatReducer,
  },
});
