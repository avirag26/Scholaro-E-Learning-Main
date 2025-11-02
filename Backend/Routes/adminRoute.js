import express from 'express';
import {
  adminLogin,
  refreshAdminToken,
  createAdmin,
  forgotPassword,
  resetPassword,
  checkAdminStatus
} from '../Controllers/admin/authController.js';
import {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminProfilePhoto
} from '../Controllers/admin/profileController.js';
import {
  getAllUsers,
  blockUser,
  unblockUser
} from '../Controllers/admin/userManagementController.js';
import {
  getAllTutors,
  blockTutor,
  unblockTutor,
  getTutorDetails
} from '../Controllers/admin/tutorManagementController.js';
import {
  toggleCategoryVisibility,
  updateCategory,
  deleteCategory,
  getAllCategories,
  addcategory
} from '../Controllers/admin/categoryManagementController.js';
import {
  getCoursesByCategory,
  getAllCourses,
  getCourseDetails,
  toggleCourseListing
} from '../Controllers/admin/courseManagementController.js';
import {
  getDashboardStats
} from '../Controllers/admin/dashboardController.js';
import { protectAdmin } from '../Middleware/adminMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/refresh-token', refreshAdminToken);
router.post('/create', createAdmin);
router.get('/users', protectAdmin, getAllUsers);
router.patch('/users/:userId/block', protectAdmin, blockUser);
router.patch('/users/:userId/unblock', protectAdmin, unblockUser);
router.get('/tutors', protectAdmin, getAllTutors);
router.get('/tutors/:tutorId/details', protectAdmin, getTutorDetails);
router.patch('/tutors/:tutorId/block', protectAdmin, blockTutor);
router.patch('/tutors/:tutorId/unblock', protectAdmin, unblockTutor);
router.get('/dashboard-stats', protectAdmin, getDashboardStats);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/check-status', protectAdmin, checkAdminStatus);


router.get('/profile', protectAdmin, getAdminProfile);
router.put('/profile', protectAdmin, updateAdminProfile);
router.post('/upload-profile-photo', protectAdmin, uploadAdminProfilePhoto);

router.post('/addcategory', protectAdmin, addcategory);
router.get('/categories', protectAdmin, getAllCategories);

router.get('/categories/:categoryId/courses', protectAdmin, getCoursesByCategory);
router.get('/courses', protectAdmin, getAllCourses);
router.get('/courses/:courseId/details', protectAdmin, getCourseDetails);
router.patch('/courses/:courseId/toggle-listing', protectAdmin, toggleCourseListing);
router.put('/categories/:id', protectAdmin, updateCategory);
router.delete('/categories/:id', protectAdmin, deleteCategory);
router.patch('/categories/:id/toggle-visibility', protectAdmin, toggleCategoryVisibility)

export default router;