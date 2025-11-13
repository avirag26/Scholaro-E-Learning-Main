import express from 'express';
import { protectUser } from '../Middleware/userMiddleware.js';


import {
  checkExamEligibility,
  getExamForStudent,
  startExamAttempt,
  submitExamAttempt,
  getExamAttemptResult
} from '../Controllers/user/examController.js';


import {
  generateCertificate,
  getUserCertificates,
  downloadCertificate,
  verifyCertificate
} from '../Controllers/user/certificateController.js';

const router = express.Router();




router.get('/users/courses/:courseId/exam-eligibility', protectUser, checkExamEligibility);
router.get('/users/courses/:courseId/exam', protectUser, getExamForStudent);
router.post('/users/exams/:examId/start', protectUser, startExamAttempt);
router.post('/users/exams/:examId/submit', protectUser, submitExamAttempt);
router.get('/users/exam-attempts/:attemptId/result', protectUser, getExamAttemptResult);


router.post('/users/certificates/generate', protectUser, generateCertificate);
router.get('/users/certificates', protectUser, getUserCertificates);
router.get('/users/certificates/:certificateId/download', protectUser, downloadCertificate);


router.get('/certificates/:verificationCode/verify', verifyCertificate);

export default router;