import express from 'express';
const router =express.Router();

import {
    registerTutor,
    loginTutor,
    verifyTutorOtp,
    resendTutorOtp,
    googleAuthTutor,
    forgotPassword,
    resetPassword,
} from '../Controllers/tutorController.js'



router.post('/register',registerTutor);
router.post('/login',loginTutor);
router.post('/verify-otp',verifyTutorOtp);
router.post('/resend-otp',resendTutorOtp);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.post("/google-auth", googleAuthTutor);

export default router