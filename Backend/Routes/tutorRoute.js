import express from 'express';
const router =express.Router();

import {
    registerTutor,
    loginTutor,
    verifyTutorOtp,
    resendTutorOtp,
    googleAuthTutor,
    
} from '../Controllers/tutorController.js'



router.post('/register',registerTutor);
router.post('/login',loginTutor);
router.post('/verify-otp',verifyTutorOtp);
router.post('/resend-otp',resendTutorOtp);
router.post("/google-auth", googleAuthTutor);

export default router