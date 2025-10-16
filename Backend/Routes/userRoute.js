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
  updateUserProfile,
  sendPasswordChangeOtp,
  changePasswordWithOtp
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
router.put("/profile", protectUser, updateUserProfile);
router.post("/change-password/send-otp", protectUser, sendPasswordChangeOtp);
router.post("/change-password/verify", protectUser, changePasswordWithOtp);

export default router;
