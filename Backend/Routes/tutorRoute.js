import express from "express";
const router = express.Router();
import {
  registerTutor,
  verifyTutorOtp,
  loginTutor,
  resendTutorOtp,
  googleAuthTutor,
  refreshTutorToken,
  forgotPassword,
  resetPassword,
  checkTutorStatus
} from "../Controllers/tutor/authController.js";
import {
  uploadTutorProfilePhoto,
  updateTutorProfile,
  getTutorProfile,
  sendTutorPasswordChangeOtp,
  changeTutorPasswordWithOtp,
  sendTutorEmailChangeOtp,
  verifyTutorEmailChangeOtp
} from "../Controllers/tutor/profileController.js";
import {
  addCourse,
  getTutorCourses,
  updateCourse,
  toggleCourseListing,
  getCourseDetails,
  getCategories,
  deleteCourse,
  submitCourse,
  getCourseByCategory
} from "../Controllers/tutor/courseManagementController.js";
import {
  createLesson,
  getCourseLessons,
  updateLesson,
  deleteLesson,
  toggleLessonPublish,
  getLessonDetails
} from "../Controllers/tutor/lessonManagementController.js";
import { protectTutor } from "../Middleware/tutorMiddleware.js";
router.post("/", registerTutor);
router.post("/verify-otp", verifyTutorOtp);
router.post("/login", loginTutor);
router.post('/register', registerTutor)
router.post("/resend-otp", resendTutorOtp);
router.post("/refresh-token", refreshTutorToken);
router.post("/google-auth", googleAuthTutor);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.get("/check-status", protectTutor, checkTutorStatus);
router.post("/upload-profile-photo", protectTutor, uploadTutorProfilePhoto);
router.get("/profile", protectTutor, getTutorProfile);
router.put("/profile", protectTutor, updateTutorProfile);
router.post("/change-password/send-otp", protectTutor, sendTutorPasswordChangeOtp);
router.post("/change-password/verify", protectTutor, changeTutorPasswordWithOtp);
router.post("/change-email/send-otp", protectTutor, sendTutorEmailChangeOtp);
router.post("/change-email/verify", protectTutor, verifyTutorEmailChangeOtp);
router.post("/courses", protectTutor, addCourse);
router.get("/courses", protectTutor, getTutorCourses);
router.get("/courses/:id", protectTutor, getCourseDetails);
router.put("/courses/:id", protectTutor, updateCourse);
router.patch("/courses/:id/toggle-listing", protectTutor, toggleCourseListing);
router.get("/categories", protectTutor, getCategories);
router.delete("/courses/:courseId", deleteCourse);
router.post("/lessons/:courseId", protectTutor, createLesson);
router.get("/lessons/:courseId", protectTutor, getCourseLessons);
router.get("/lesson/:lessonId", protectTutor, getLessonDetails);
router.put("/lessons/:lessonId", protectTutor, updateLesson);
router.delete("/lessons/:lessonId", protectTutor, deleteLesson);
router.patch("/lessons/:lessonId/toggle-publish", protectTutor, toggleLessonPublish);
router.post("/submit-course/:courseId", submitCourse);
router.get("/courses/category/:categoryId", getCourseByCategory);
export default router;
