import User from "../../Model/usermodel.js";
import Tutor from "../../Model/TutorModel.js";

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTutors = await Tutor.countDocuments();
    const verifiedUsers = await User.countDocuments({ is_verified: true });
    const verifiedTutors = await Tutor.countDocuments({ is_verified: true });
    const blockedUsers = await User.countDocuments({ is_blocked: true });
    const blockedTutors = await Tutor.countDocuments({ is_blocked: true });
    res.status(200).json({
      totalUsers,
      totalTutors,
      verifiedUsers,
      verifiedTutors,
      blockedUsers,
      blockedTutors
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getDashboardStats
};