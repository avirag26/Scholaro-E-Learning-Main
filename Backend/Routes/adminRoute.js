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
  toggleCourseListing,
  refreshEnrollmentCounts
} from '../Controllers/admin/courseManagementController.js';
import {
  getDashboardStats
} from '../Controllers/admin/dashboardController.js';
import {
  cleanupUnavailableCourses
} from '../Controllers/user/cartController.js';
import {
  getWallet,
  getWalletTransactions,
  getWalletStatistics
} from '../Controllers/common/walletController.js';
import {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  getOrderStats
} from '../Controllers/admin/orderManagementController.js';
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
router.post('/courses/refresh-enrollment-counts', protectAdmin, refreshEnrollmentCounts);
router.put('/categories/:id', protectAdmin, updateCategory);
router.delete('/categories/:id', protectAdmin, deleteCategory);
router.patch('/categories/:id/toggle-visibility', protectAdmin, toggleCategoryVisibility);

// Order management routes
router.get('/orders/test', protectAdmin, async (req, res) => {
  try {
    const OrderModel = (await import('../../Model/OrderModel.js')).default;
    const orderCount = await OrderModel.countDocuments();
    res.json({
      success: true,
      message: 'Admin orders route is working',
      admin: req.admin.full_name,
      orderCount: orderCount
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'Admin orders route is working',
      admin: req.admin.full_name,
      error: error.message
    });
  }
});
router.get('/orders', protectAdmin, getAllOrders);
router.get('/orders/stats', protectAdmin, getOrderStats);
router.get('/orders/:orderId', protectAdmin, getOrderDetails);
router.patch('/orders/:orderId/status', protectAdmin, updateOrderStatus);

// Cart cleanup route
router.delete('/carts/cleanup-unavailable', protectAdmin, cleanupUnavailableCourses);

// Wallet routes
router.get('/wallet', protectAdmin, getWallet);
router.get('/wallet/transactions', protectAdmin, getWalletTransactions);
router.get('/wallet/statistics', protectAdmin, getWalletStatistics);

export default router;