import express from 'express';
import {
  adminLogin,
  createAdmin,
  getAllUsers,
  blockUser,
  unblockUser
} from '../Controllers/adminController.js';
import { protectAdmin } from '../Middleware/adminMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/create', createAdmin);
router.get('/users', protectAdmin, getAllUsers);
router.patch('/users/:userId/block', protectAdmin, blockUser);
router.patch('/users/:userId/unblock', protectAdmin, unblockUser);

export default router;