import express from "express";
import User from "../Model/usermodel.js";
const router = express.Router();
import {
  registerUser,
  verifyOtp,
  loginUser,
  resendOtp,
  googleAuth,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  checkUserStatus
} from "../Controllers/user/authController.js";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
  sendEmailChangeOtp,
  verifyEmailChangeOtp
} from "../Controllers/user/profileController.js";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  moveToWishlist,
  removeUnavailableFromCart
} from "../Controllers/user/cartController.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  clearWishlist
} from "../Controllers/user/wishlistController.js";
import {
  getPublicCategories,
  getPublicCourses,
  getCoursesByCategory,
  getCourseDetails,
  getPublicTutors,
  getTutorDetails
} from "../Controllers/common/publicController.js";
import {
  createOrder,
  verifyPayment,
  getOrder,
  getUserOrders,
  generateInvoice
} from "../Controllers/common/paymentController.js";
import {
  getUserChats,
  createOrGetChat,
  getChatMessages,
  markChatAsRead,
  getAvailableTutors,
  clearChatMessages
} from "../Controllers/common/chatController.js";
import { protectUser } from "../Middleware/userMiddleware.js";

router.route("/").post(registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post("/resend-otp", resendOtp);
router.post("/google-auth", googleAuth);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/check-status", protectUser, checkUserStatus);
router.get("/profile", protectUser, getUserProfile);
router.put("/profile", protectUser, updateUserProfile);
router.post("/upload-profile-photo", protectUser, uploadProfilePhoto);
router.post("/change-password/send-otp", protectUser, sendPasswordChangeOtp);
router.post("/change-password/verify", protectUser, changePasswordWithOtp);
router.post("/change-email/send-otp", protectUser, sendEmailChangeOtp);
router.post("/change-email/verify", protectUser, verifyEmailChangeOtp);
router.get("/categories", getPublicCategories);
router.get("/courses", getPublicCourses);
router.get("/courses/category/:categoryId", getCoursesByCategory);
router.get("/courses/:courseId", getCourseDetails);
router.get("/tutors", getPublicTutors);
router.get("/tutors/:tutorId", getTutorDetails);

// Cart routes
router.get("/cart", protectUser, getCart);
router.post("/cart/add", protectUser, addToCart);
router.delete("/cart/remove/:courseId", protectUser, removeFromCart);
router.delete("/cart/clear", protectUser, clearCart);
router.post("/cart/move-to-wishlist", protectUser, moveToWishlist);
router.delete("/cart/cleanup-unavailable", protectUser, removeUnavailableFromCart);

// Wishlist routes
router.get("/wishlist", protectUser, getWishlist);
router.post("/wishlist/add", protectUser, addToWishlist);
router.delete("/wishlist/remove/:courseId", protectUser, removeFromWishlist);
router.post("/wishlist/move-to-cart", protectUser, moveToCart);
router.delete("/wishlist/clear", protectUser, clearWishlist);

// Payment routes
router.post("/payment/create-order", protectUser, createOrder);
router.post("/payment/verify", protectUser, verifyPayment);
router.get("/payment/order/:orderId", protectUser, getOrder);
router.get("/payment/orders", protectUser, getUserOrders);
router.get("/payment/invoice/:orderId", protectUser, generateInvoice);

// Chat routes
router.get("/chats", protectUser, getUserChats);
router.post("/chats", protectUser, createOrGetChat);
router.get("/chats/:chatId/messages", protectUser, getChatMessages);
router.put("/chats/:chatId/read", protectUser, markChatAsRead);
router.delete("/chats/:chatId/clear", protectUser, clearChatMessages);

router.get("/available-tutors", protectUser, getAvailableTutors);

export default router;
