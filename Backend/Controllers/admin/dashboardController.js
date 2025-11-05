import User from "../../Model/usermodel.js";
import Tutor from "../../Model/TutorModel.js";
import Order from "../../Model/OrderModel.js";
import { Course } from "../../Model/CourseModel.js";

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTutors = await Tutor.countDocuments();
    const verifiedUsers = await User.countDocuments({ is_verified: true });
    const verifiedTutors = await Tutor.countDocuments({ is_verified: true });
    const blockedUsers = await User.countDocuments({ is_blocked: true });
    const blockedTutors = await Tutor.countDocuments({ is_blocked: true });
    

    const totalOrders = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ status: 'paid' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]).then(result => result[0]?.total || 0);
    
    // Course statistics
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ isActive: true, listed: true });
    
    res.status(200).json({
      totalUsers,
      totalTutors,
      verifiedUsers,
      verifiedTutors,
      blockedUsers,
      blockedTutors,
      totalOrders,
      paidOrders,
      pendingOrders,
      totalRevenue,
      totalCourses,
      activeCourses
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getDashboardStats
};