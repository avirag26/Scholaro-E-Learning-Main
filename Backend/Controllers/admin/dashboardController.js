import { Course } from "../../Model/CourseModel.js";
import Category from "../../Model/CategoryModel.js";
import mongoose from "mongoose";

const getDashboardStats = async (req, res) => {
  try {
    // Import User and Tutor models dynamically to avoid circular dependencies
    const User = (await import('../../Model/usermodel.js')).default;
    const Tutor = (await import('../../Model/TutorModel.js')).default;
    const Order = (await import('../../Model/OrderModel.js')).default;

    // Get user statistics (students only)
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ is_blocked: false });
    const verifiedUsers = await User.countDocuments({ is_verified: true });
    const blockedUsers = await User.countDocuments({ is_blocked: true });

    // Get tutor statistics
    const totalTutors = await Tutor.countDocuments();
    const verifiedTutors = await Tutor.countDocuments({ is_verified: true });
    const blockedTutors = await Tutor.countDocuments({ is_blocked: true });

    // Get course statistics
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ 
      isActive: true, 
      isBanned: false,
      listed: true 
    });

    // Get order statistics
    const totalOrders = await Order.countDocuments();
    
    // Calculate total revenue from admin wallet earnings
    const Wallet = (await import('../../Model/WalletModel.js')).default;
    const adminWallet = await Wallet.findOne({ ownerType: 'Admin' });
    const totalRevenue = adminWallet ? adminWallet.totalEarnings : 0;

    const stats = {
      totalUsers,
      activeUsers,
      totalTutors,
      verifiedUsers,
      verifiedTutors,
      blockedUsers,
      blockedTutors,
      totalCourses,
      totalRevenue,
      totalOrders,
      activeCourses
    };

    res.status(200).json({
      success: true,
      ...stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
};

export {
  getDashboardStats
};