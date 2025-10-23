import express from "express";
const router = express.Router();
import {
  registerUser,
  verifyOtp,
  loginUser,
  resendOtp,
  googleAuth,
  forgotPassword,
  resetPassword,
  checkUserStatus,
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
  getPublicCategories,
  getPublicCourses,
  getCoursesByCategory,
  getCourseDetails
} from "../Controllers/userController.js";
import { protectUser } from "../Middleware/userMiddleware.js";

router.route("/").post(registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post("/resend-otp", resendOtp);
router.post("/google-auth", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/check-status", protectUser, checkUserStatus);
router.get("/profile", protectUser, getUserProfile);
router.put("/profile", protectUser, updateUserProfile);
router.post("/upload-profile-photo", protectUser, uploadProfilePhoto);
router.post("/change-password/send-otp", protectUser, sendPasswordChangeOtp);
router.post("/change-password/verify", protectUser, changePasswordWithOtp);
router.post("/change-email/send-otp", protectUser, sendEmailChangeOtp);
router.post("/change-email/verify", protectUser, verifyEmailChangeOtp);


router.get("/categories", getPublicCategories);
router.get("/courses", getPublicCourses);
router.get("/courses/category/:categoryId", getCoursesByCategory);
router.get("/courses/:courseId", getCourseDetails);

export default router;
