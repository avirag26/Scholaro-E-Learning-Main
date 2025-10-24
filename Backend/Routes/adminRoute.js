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
  getDashboardStats,
  forgotPassword,
  resetPassword,
  checkAdminStatus,
  getAdminProfile,
  updateAdminProfile,
  uploadAdminProfilePhoto,

  toggleCategoryVisibility,
  updateCategory,
  deleteCategory,
  getAllCategories,
  addcategory
} from '../Controllers/adminController.js';
import { protectAdmin } from '../Middleware/adminMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/create', createAdmin);
router.get('/users', protectAdmin, getAllUsers);
router.patch('/users/:userId/block', protectAdmin, blockUser);
router.patch('/users/:userId/unblock', protectAdmin, unblockUser);
router.get('/tutors', protectAdmin, getAllTutors);
router.patch('/tutors/:tutorId/block', protectAdmin, blockTutor);
router.patch('/tutors/:tutorId/unblock', protectAdmin, unblockTutor);
router.get('/dashboard-stats', protectAdmin, getDashboardStats);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/check-status', protectAdmin, checkAdminStatus);


router.get('/profile', protectAdmin, getAdminProfile);
router.put('/profile', protectAdmin, updateAdminProfile);
router.post('/upload-profile-photo', protectAdmin, uploadAdminProfilePhoto);

router.post('/addcategory', addcategory);
router.get('/categories', getAllCategories);
router.put('/categories/:id',updateCategory);
router.delete('/categories/:id',deleteCategory);
router.patch('/categories/:id/toggle-visibility',toggleCategoryVisibility)


export default router;