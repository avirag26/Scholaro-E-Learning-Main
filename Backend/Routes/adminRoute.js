import express from 'express';
import {
  adminLogin,
  createAdmin,
  getAllUsers,
  blockUser,
  unblockUser,
  getAllTutors,
  blockTutor,
  unblockTutor,
  forgotPassword,
  resetPassword
} from '../Controllers/adminController.js';
import { protectAdmin } from '../Middleware/adminMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/create', createAdmin);
router.get('/users', protectAdmin, getAllUsers);
router.patch('/users/:userId/block', protectAdmin, blockUser);
router.patch('/users/:userId/unblock', protectAdmin, unblockUser);
router.get('/tutors',protectAdmin,getAllTutors);
router.patch('/tutors/:tutorId/block',protectAdmin,blockTutor);
router.patch('/tutors/:tutorId/unblock',protectAdmin,unblockTutor);
router.post('/forgot-password',forgotPassword);
router.patch('/reset-password/:token', resetPassword);

export default router;