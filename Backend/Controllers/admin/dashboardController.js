import { Course } from "../../Model/CourseModel.js";
import Category from "../../Model/CategoryModel.js";
import mongoose from "mongoose";

const getDashboardStats = async (req, res) => {
  try {
    // Import User and Tutor models dynamically to avoid circular dependencies
    const User = (await import('../../Model/usermodel.js')).default;
    const Tutor = (await import('../../Model/TutorModel.js')).default;
    const Order = (await import('../../Model/OrderModel.js')).default;

    // Get all statistics in parallel using Promise.all
    const Wallet = (await import('../../Model/WalletModel.js')).default;
    
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      blockedUsers,
      totalTutors,
      verifiedTutors,
      blockedTutors,
      totalCourses,
      activeCourses,
      totalOrders,
      adminWallet
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ is_blocked: false }),
      User.countDocuments({ is_verified: true }),
      User.countDocuments({ is_blocked: true }),
      Tutor.countDocuments(),
      Tutor.countDocuments({ is_verified: true }),
      Tutor.countDocuments({ is_blocked: true }),
      Course.countDocuments(),
      Course.countDocuments({ 
        isActive: true, 
        isBanned: false,
        listed: true 
      }),
      Order.countDocuments(),
      Wallet.findOne({ ownerType: 'Admin' })
    ]);
    
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