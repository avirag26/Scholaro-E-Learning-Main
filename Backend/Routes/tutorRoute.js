import express from "express";
const router = express.Router();
import {
  registerTutor,
  verifyTutorOtp,
  loginTutor,
  resendTutorOtp,
  googleAuthTutor,
  refreshTutorToken,
  forgotPassword,
  resetPassword,
  checkTutorStatus
} from "../Controllers/tutor/authController.js";
import {
  uploadTutorProfilePhoto,
  updateTutorProfile,
  getTutorProfile,
  sendTutorPasswordChangeOtp,
  changeTutorPasswordWithOtp,
  sendTutorEmailChangeOtp,
  verifyTutorEmailChangeOtp
} from "../Controllers/tutor/profileController.js";
import {
  addCourse,
  getTutorCourses,
  updateCourse,
  toggleCourseListing,
  getCourseDetails,
  getCategories,
  deleteCourse,
  submitCourse,
  getCourseByCategory
} from "../Controllers/tutor/courseManagementController.js";
import {
  createLesson,
  getCourseLessons,
  updateLesson,
  deleteLesson,
  toggleLessonPublish,
  getLessonDetails
} from "../Controllers/tutor/lessonManagementController.js";
import {
  getTutorOrders,
  getTutorOrderDetails,
  getTutorOrderStats
} from "../Controllers/tutor/orderManagementController.js";
import {
  getUserChats,
  getChatMessages,
  markChatAsRead,
  getTutorStudents,
  clearChatMessages,
  createOrGetChatByTutor
} from "../Controllers/common/chatController.js";
import {
  getWallet,
  getWalletTransactions,
  updateBankDetails,
  requestWithdrawal
} from "../Controllers/common/walletController.js";
import { protectTutor } from "../Middleware/tutorMiddleware.js";

router.post("/", registerTutor);
router.post("/verify-otp", verifyTutorOtp);
router.post("/login", loginTutor);
router.post('/register', registerTutor)
router.post("/resend-otp", resendTutorOtp);
router.post("/refresh-token", refreshTutorToken);
router.post("/google-auth", googleAuthTutor);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.get("/check-status", protectTutor, checkTutorStatus);
router.post("/upload-profile-photo", protectTutor, uploadTutorProfilePhoto);
router.get("/profile", protectTutor, getTutorProfile);
router.put("/profile", protectTutor, updateTutorProfile);
router.post("/change-password/send-otp", protectTutor, sendTutorPasswordChangeOtp);
router.post("/change-password/verify", protectTutor, changeTutorPasswordWithOtp);
router.post("/change-email/send-otp", protectTutor, sendTutorEmailChangeOtp);
router.post("/change-email/verify", protectTutor, verifyTutorEmailChangeOtp);
router.post("/courses", protectTutor, addCourse);
router.get("/courses", protectTutor, getTutorCourses);
router.get("/courses/:id", protectTutor, getCourseDetails);
router.put("/courses/:id", protectTutor, updateCourse);
router.patch("/courses/:id/toggle-listing", protectTutor, toggleCourseListing);
router.get("/categories", protectTutor, getCategories);
router.delete("/courses/:courseId", deleteCourse);
router.post("/lessons/:courseId", protectTutor, createLesson);
router.get("/lessons/:courseId", protectTutor, getCourseLessons);
router.get("/lesson/:lessonId", protectTutor, getLessonDetails);
router.put("/lessons/:lessonId", protectTutor, updateLesson);
router.delete("/lessons/:lessonId", protectTutor, deleteLesson);
router.patch("/lessons/:lessonId/toggle-publish", protectTutor, toggleLessonPublish);
router.post("/submit-course/:courseId", submitCourse);
router.get("/courses/category/:categoryId", getCourseByCategory);

// Order management routes
router.get("/orders", protectTutor, getTutorOrders);
router.get("/orders/stats", protectTutor, getTutorOrderStats);
router.get("/orders/:orderId", protectTutor, getTutorOrderDetails);

// Chat routes
router.get("/chats", protectTutor, getUserChats);
router.post("/chats", protectTutor, createOrGetChatByTutor);
router.get("/chats/:chatId/messages", protectTutor, getChatMessages);
router.put("/chats/:chatId/read", protectTutor, markChatAsRead);
router.delete("/chats/:chatId/clear", protectTutor, clearChatMessages);

router.get("/students", protectTutor, getTutorStudents);

// Wallet routes
router.get("/wallet", protectTutor, getWallet);
router.get("/wallet/transactions", protectTutor, getWalletTransactions);
router.put("/wallet/bank-details", protectTutor, updateBankDetails);
router.post("/wallet/withdraw", protectTutor, requestWithdrawal);

export default router;
