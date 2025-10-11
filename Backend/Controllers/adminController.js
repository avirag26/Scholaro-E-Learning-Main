import User from "../Model/usermodel.js";
import Admin from "../Model/AdminModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const createAdmin = async (req, res, next) => {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
      res.status(400);
      throw new Error(
        "Please provide all required fields: full_name, email, password"
      );
    }

    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      res.status(400);
      throw new Error("Admin with this email already exists");
    }

    const admin = await Admin.create({
      full_name,
      email,
      password,
      admin_id: uuidv4(),
      role: role || "admin",
    });

    if (admin) {
      res.status(201).json({
        message: "Admin created successfully.",
        admin: {
          _id: admin._id,
          full_name: admin.full_name,
          email: admin.email,
          role: admin.role,
        },
      });
    } else {
      res.status(400);
      throw new Error("Invalid admin data");
    }
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }
    if (admin && (await admin.matchPassword(password))) {
      const refreshToken = generateRefreshToken(admin._id);
      const accessToken = generateAccessToken(admin._id);

      admin.refreshToken = refreshToken;
      await admin.save();

      res.cookie("jwt_admin", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.status(200).json({
        _id: admin._id,
        full_name: admin.full_name,
        email: admin.email,
        accessToken: accessToken,
      });
    } else {
      return res.status(400).json({ message: "Invalid Email or username" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error during login" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Fixed to 5 users per page
    const skip = (page - 1) * limit;

    // Get search and filter parameters
    const search = req.query.search || "";
    const status = req.query.status || "all";

    // Build query
    let query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter
    if (status === "active") {
      query.is_blocked = false;
    } else if (status === "blocked") {
      query.is_blocked = true;
    }

    console.log("Query:", query, "Page:", page, "Limit:", limit);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    // Get counts for listed/unlisted students (regardless of current query)
    const listedStudents = await User.countDocuments({ is_blocked: false });
    const unlistedStudents = await User.countDocuments({ is_blocked: true });

    // Get users with pagination
    const users = await User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    console.log(`Found ${users.length} users on page ${page} of ${totalPages}`);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalUsers: totalUsers,
        limit: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        total: await User.countDocuments({}),
        listed: listedStudents,
        unlisted: unlistedStudents,
      },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Blocking user: ${userId}`);

    const user = await User.findByIdAndUpdate(
      userId,
      { is_blocked: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: user,
    });
  } catch (error) {
    console.error("Failed to block user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to block user",
      error: error.message,
    });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Unblocking user: ${userId}`);

    const user = await User.findByIdAndUpdate(
      userId,
      { is_blocked: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: user,
    });
  } catch (error) {
    console.error("Failed to unblock user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unblock user",
      error: error.message,
    });
  }
};

export { createAdmin, adminLogin, getAllUsers, blockUser, unblockUser };
