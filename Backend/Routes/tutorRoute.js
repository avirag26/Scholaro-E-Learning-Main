import express from "express";
const router = express.Router();
import {
  registerTutor,
  verifyTutorOtp,
  loginTutor,
  resendTutorOtp,
  googleAuthTutor,
  forgotPassword,
  resetPassword,
  checkTutorStatus,
  uploadTutorProfilePhoto,
  updateTutorProfile,
  getTutorProfile,
  sendTutorPasswordChangeOtp,
  changeTutorPasswordWithOtp,
  sendTutorEmailChangeOtp,
  verifyTutorEmailChangeOtp,
} from "../Controllers/tutorController.js";
import {
  addCourse,
  getTutorCourses,
  updateCourse,
  toggleCourseListing,
  getCourseDetails,
  getCategories
} from "../Controllers/courseController.js";
import { protectTutor } from "../Middleware/tutorMiddleware.js";

router.post("/", registerTutor);
router.post("/verify-otp", verifyTutorOtp);
router.post("/login", loginTutor);
router.post('/register',registerTutor)
router.post("/resend-otp", resendTutorOtp);
router.post("/google-auth", googleAuthTutor);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.get("/check-status", protectTutor, checkTutorStatus);
router.post("/upload-profile-photo", protectTutor, uploadTutorProfilePhoto);

// Profile management routes
router.get("/profile", protectTutor, getTutorProfile);
router.put("/profile", protectTutor, updateTutorProfile);
router.post("/change-password/send-otp", protectTutor, sendTutorPasswordChangeOtp);
router.post("/change-password/verify", protectTutor, changeTutorPasswordWithOtp);
router.post("/change-email/send-otp", protectTutor, sendTutorEmailChangeOtp);
router.post("/change-email/verify", protectTutor, verifyTutorEmailChangeOtp);

// Course management routes
router.post("/courses", protectTutor, addCourse);
router.get("/courses", protectTutor, getTutorCourses);
router.get("/courses/:id", protectTutor, getCourseDetails);
router.put("/courses/:id", protectTutor, updateCourse);
router.patch("/courses/:id/toggle-listing", protectTutor, toggleCourseListing);
router.get("/categories", protectTutor, getCategories);

export default router;