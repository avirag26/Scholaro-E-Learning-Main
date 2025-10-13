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
} from "../Controllers/tutorController.js";
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

export default router;