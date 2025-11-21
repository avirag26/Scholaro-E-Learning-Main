import User from "../../Model/usermodel.js";
import { STATUS_CODES } from "../../constants/constants.js";

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    let query = {};
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status !== 'all') {
      if (status === 'verified') query.is_verified = true;
      if (status === 'unverified') query.is_verified = false;
      if (status === 'blocked') query.is_blocked = true;
      if (status === 'active') query.is_blocked = false;
    }
    const [users, totalUsers, listedCount, unlistedCount, unverifiedCount] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
      User.countDocuments({ is_verified: true, is_blocked: false }),
      User.countDocuments({ is_blocked: true }),
      User.countDocuments({ is_verified: false })
    ]);
    
    res.status(STATUS_CODES.OK).json({
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalItems: totalUsers,
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      },
      stats: {
        total: totalUsers,
        listed: listedCount,
        unlisted: unlistedCount,
        unverified: unverifiedCount
      }
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }
    user.is_blocked = true;
    await user.save();
    res.status(STATUS_CODES.OK).json({
      success: true,
      message: "User blocked successfully"
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }
    user.is_blocked = false;
    await user.save();
    res.status(STATUS_CODES.OK).json({
      success: true,
      message: "User unblocked successfully"
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

export {
  getAllUsers,
  blockUser,
  unblockUser
};
