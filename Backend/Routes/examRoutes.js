import express from 'express';
import { protectUser } from '../Middleware/userMiddleware.js';

// User exam controllers
import {
  checkExamEligibility,
  getExamForStudent,
  startExamAttempt,
  submitExamAttempt,
  getExamAttemptResult
} from '../Controllers/user/examController.js';

// Certificate controllers
import {
  generateCertificate,
  getUserCertificates,
  downloadCertificate,
  verifyCertificate
} from '../Controllers/user/certificateController.js';

const router = express.Router();

// Test route to verify exam routes are loaded
router.get('/test-exam-routes', (req, res) => {
  res.json({ success: true, message: 'Exam routes are loaded!' });
});

// ========== USER ROUTES ==========
// Exam taking
router.get('/users/courses/:courseId/exam-eligibility', protectUser, checkExamEligibility);
router.get('/users/courses/:courseId/exam', protectUser, getExamForStudent);
router.post('/users/exams/:examId/start', protectUser, startExamAttempt);
router.post('/users/exams/:examId/submit', protectUser, submitExamAttempt);
router.get('/users/exam-attempts/:attemptId/result', protectUser, getExamAttemptResult);

// Certificate management
router.post('/users/certificates/generate', protectUser, generateCertificate);
router.get('/users/certificates', protectUser, getUserCertificates);
router.get('/users/certificates/:certificateId/download', protectUser, downloadCertificate);

// ========== PUBLIC ROUTES ==========
// Certificate verification (no auth required)
router.get('/certificates/:verificationCode/verify', verifyCertificate);

export default router;