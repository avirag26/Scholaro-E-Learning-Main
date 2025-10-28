import User from "../Model/usermodel.js";
import Admin from "../Model/AdminModel.js";
import Tutor from "../Model/TutorModel.js";
import Category from "../Model/CategoryModel.js";
import { updateCoursesByCategory, Course } from "../Model/CourseModel.js";
import mongoose from "mongoose";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import { sendOtpToEmail, verifyEmailOtp, sendOtpWithData, verifyOtpWithData } from "../utils/otpService.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import bcrypt from "bcryptjs";
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    if (admin.is_blocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }
    const isPasswordValid = await admin.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const accessToken = generateAccessToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);
    admin.refreshToken = refreshToken;
    admin.lastLogin = new Date();
    await admin.save();
    const adminInfo = {
      _id: admin._id,
      name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      profileImage: admin.profileImage
    };
    res.cookie('adminRefreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(200).json({
      message: "Login successful",
      accessToken,
      admin: adminInfo
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};
const refreshAdminToken = async (req, res) => {
  try {
    const refreshTokenFromCookie = req.cookies.adminRefreshToken;
    if (!refreshTokenFromCookie) {
      return res.status(401).json({ message: "Refresh token required" });
    }
    const admin = await Admin.findOne({ refreshToken: refreshTokenFromCookie });
    if (!admin) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const newAccessToken = generateAccessToken(admin._id);
    const newRefreshToken = generateRefreshToken(admin._id);
    admin.refreshToken = newRefreshToken;
    await admin.save();
    res.cookie('adminRefreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(200).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
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
    const users = await User.find(query)
      .select('-password -refreshToken')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalUsers = await User.countDocuments(query);
    res.status(200).json({
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
        listed: await User.countDocuments({ is_verified: true, is_blocked: false }),
        unlisted: await User.countDocuments({ is_blocked: true }),
        unverified: await User.countDocuments({ is_verified: false })
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const getAllTutors = async (req, res) => {
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
    const tutors = await Tutor.find(query)
      .select('-password -refreshToken')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalTutors = await Tutor.countDocuments(query);
    res.status(200).json({
      data: tutors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTutors / limit),
        totalItems: totalTutors,
        hasNext: page < Math.ceil(totalTutors / limit),
        hasPrev: page > 1
      },
      stats: {
        total: totalTutors,
        listed: await Tutor.countDocuments({ is_verified: true, is_blocked: false }),
        unlisted: await Tutor.countDocuments({ is_blocked: true })
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.is_blocked = true;
    await user.save();
    res.status(200).json({
      success: true,
      message: "User blocked successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.is_blocked = false;
    await user.save();
    res.status(200).json({
      success: true,
      message: "User unblocked successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const blockTutor = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    tutor.is_blocked = true;
    await tutor.save();
    res.status(200).json({
      success: true,
      message: "Tutor blocked successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const unblockTutor = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    tutor.is_blocked = false;
    await tutor.save();
    res.status(200).json({
      success: true,
      message: "Tutor unblocked successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
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
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password -refreshToken');
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({
      admin: {
        _id: admin._id,
        name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        profileImage: admin.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const adminId = req.admin._id;

    // Validate name if provided
    if (name) {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({ message: "Name must be between 2 and 50 characters" });
      }
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({ message: "Name can only contain letters and spaces" });
      }
      if (/\d/.test(name)) {
        return res.status(400).json({ message: "Name cannot contain numbers" });
      }
      if (name.includes('_')) {
        return res.status(400).json({ message: "Name cannot contain underscores" });
      }
    }

    // Validate phone if provided
    if (phone) {
      if (!/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ message: "Please enter a valid 10-digit Indian phone number starting with 6-9" });
      }
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (name) admin.full_name = name.trim();
    if (phone) admin.phone = phone;
    await admin.save();
    res.status(200).json({
      message: "Profile updated successfully",
      admin: {
        _id: admin._id,
        name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        profileImage: admin.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const uploadAdminProfilePhoto = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const adminId = req.admin._id;
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }
    try {
      new URL(imageUrl);
    } catch (error) {
      return res.status(400).json({ message: "Invalid image URL format" });
    }
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    admin.profileImage = imageUrl;
    await admin.save();
    res.status(200).json({
      message: "Profile photo updated successfully",
      profileImage: admin.profileImage
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while uploading profile photo" });
  }
};
const createAdmin = async (req, res) => {
  try {
    const { full_name, email, password, role = 'admin' } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    const admin = new Admin({
      full_name,
      email,
      password,
      role,
      admin_id: uuidv4()
    });
    await admin.save();
    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        _id: admin._id,
        name: admin.full_name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    admin.passwordResetToken = resetToken;
    admin.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await admin.save();
    await sendPasswordResetEmail(email, resetToken, 'admin');
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }
    const admin = await Admin.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    admin.password = password;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Admin reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const checkAdminStatus = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('is_blocked');
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (admin.is_blocked) {
      return res.status(403).json({ message: "Account blocked", blocked: true });
    }
    res.status(200).json({ message: "Account active", blocked: false });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const addcategory = async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: "Title and Description are required" });
  }

  try {
    // Check if category with same title already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category with this title already exists",
        success: false
      });
    }

    const category = new Category({ title, description });
    await category.save();
    res.status(201).json({
      message: "Category Added Successfully",
      category,
      success: true
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Category with this title already exists",
        success: false
      });
    }
    res.status(500).json({ message: "Failed to create category" });
  }
}
const getAllCategories = async (req, res) => {
  try {
    const skipPagination = req.query.all === "true";
    if (skipPagination) {
      const categories = await Category.find().sort({ createdAt: -1 });
      const formattedCategories = categories.map((category) => ({
        id: category._id,
        title: category.title,
        description: category.description,
        isVisible: category.isVisible,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }));
      return res.json({
        categories: formattedCategories,
        pagination: null,
      })
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCategories = await Category.countDocuments(query);
    const totalPages = Math.ceil(totalCategories / limit);
    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const formattedCategories = categories.map((category) => ({
      id: category._id,
      title: category.title,
      description: category.description,
      isVisible: category.isVisible,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
    res.json({
      categories: formattedCategories,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCategories,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch Categories" })
  }
}
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    // Check if another category with same title already exists (excluding current category)
    const existingCategory = await Category.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') },
      _id: { $ne: id }
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category with this title already exists",
        success: false
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({
      message: "Category updated successfully",
      category,
      success: true
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Category with this title already exists",
        success: false
      });
    }
    res.status(500).json({ message: "Failed to update category" });
  }
}
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    category.isVisible = !category.isVisible;
    await category.save();
    const action = category.isVisible ? "listed" : "unlisted";
    res.status(200).json({
      message: `Category ${action} successfully`,
      category
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update category visibility" });
  }
}
const toggleCategoryVisibility = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID format",
      });
    }
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }
    category.isVisible = !category.isVisible;
    await category.save();
    await updateCoursesByCategory(id, category.isVisible);
    res.json({
      message: `Category visibility updated to ${category.isVisible ? "visible" : "hidden"
        }`,
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update category visibility",
      error: error.message,
    });
  }
};

const getCoursesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const rating = req.query.rating || 'all';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    let matchStage = {
      category: new mongoose.Types.ObjectId(categoryId)
    };

    // Apply status filter
    if (status === 'listed') {
      matchStage.listed = true;
    } else if (status === 'unlisted') {
      matchStage.listed = false;
    } else if (status === 'active') {
      matchStage.isActive = true;
      matchStage.isBanned = false;
    } else {
      // For 'all', show all courses but exclude banned ones
      matchStage.isBanned = false;
    }

    // Apply rating filter
    if (rating !== 'all') {
      const minRating = parseInt(rating.replace('+', ''));
      matchStage.average_rating = { $gte: minRating };
    }

    // Apply price filter
    if (minPrice !== null || maxPrice !== null) {
      const priceFilter = {};
      if (minPrice !== null) priceFilter.$gte = minPrice;
      if (maxPrice !== null) priceFilter.$lte = maxPrice;
      matchStage.price = priceFilter;
    }

    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'tutors',
          localField: 'tutor',
          foreignField: '_id',
          as: 'tutorInfo'
        }
      },
      {
        $match: {
          'tutorInfo.is_blocked': { $ne: true }
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          offer_percentage: 1,
          course_thumbnail: 1,
          average_rating: 1,
          total_reviews: 1,
          enrolled_count: 1,
          createdAt: 1,
          tutor: {
            $arrayElemAt: ['$tutorInfo', 0]
          }
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          offer_percentage: 1,
          course_thumbnail: 1,
          average_rating: 1,
          total_reviews: 1,
          enrolled_count: 1,
          createdAt: 1,
          'tutor.full_name': 1,
          'tutor.profileImage': 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const courses = await Course.aggregate(pipeline);
    
    const totalPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'tutors',
          localField: 'tutor',
          foreignField: '_id',
          as: 'tutorInfo'
        }
      },
      {
        $match: {
          'tutorInfo.is_blocked': { $ne: true }
        }
      },
      { $count: 'total' }
    ];

    const totalResult = await Course.aggregate(totalPipeline);
    const totalCourses = totalResult.length > 0 ? totalResult[0].total : 0;

    const formattedCourses = courses.map((course) => ({
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage,
      course_thumbnail: course.course_thumbnail,
      average_rating: course.average_rating || 0,
      total_reviews: course.total_reviews || 0,
      enrolled_count: course.enrolled_count || 0,
      tutor: {
        full_name: course.tutor?.full_name || 'Unknown',
        profileImage: course.tutor?.profileImage
      },
      createdAt: course.createdAt
    }));

    res.status(200).json({
      success: true,
      category: {
        id: category._id,
        title: category.title,
        description: category.description
      },
      courses: formattedCourses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit),
        totalItems: totalCourses,
        hasNext: page < Math.ceil(totalCourses / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses"
    });
  }
};

const getTutorDetails = async (req, res) => {
  try {
    const { tutorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tutor ID"
      });
    }

    const tutor = await Tutor.findById(tutorId).select('-password -refreshToken');
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found"
      });
    }

    // Get tutor's courses
    const courses = await Course.find({ tutor: tutorId })
      .populate('category', 'title')
      .select('title description price offer_percentage course_thumbnail average_rating total_reviews enrolled_count listed isActive createdAt')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, course) => sum + (course.enrolled_count || 0), 0);
    const totalReviews = courses.reduce((sum, course) => sum + (course.total_reviews || 0), 0);
    const averageRating = totalReviews > 0 
      ? courses.reduce((sum, course) => sum + (course.average_rating || 0), 0) / courses.length 
      : 0;

    const formattedCourses = courses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage,
      course_thumbnail: course.course_thumbnail,
      average_rating: course.average_rating || 0,
      total_reviews: course.total_reviews || 0,
      enrolled_count: course.enrolled_count || 0,
      listed: course.listed,
      isActive: course.isActive,
      category: course.category,
      createdAt: course.createdAt
    }));

    const tutorData = {
      _id: tutor._id,
      tutor_id: tutor.tutor_id,
      full_name: tutor.full_name,
      email: tutor.email,
      phone: tutor.phone,
      profileImage: tutor.profileImage,
      bio: tutor.bio,
      subjects: tutor.subjects,
      is_verified: tutor.is_verified,
      is_blocked: tutor.is_blocked,
      lastLogin: tutor.lastLogin,
      createdAt: tutor.createdAt,
      updatedAt: tutor.updatedAt,
      courses: formattedCourses,
      statistics: {
        totalCourses,
        totalStudents,
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1))
      }
    };

    res.status(200).json({
      success: true,
      tutor: tutorData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tutor details"
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const categoryFilter = req.query.category || 'all';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const rating = req.query.rating || 'all';

    // Get all categories or specific category
    let categories;
    if (categoryFilter !== 'all') {
      categories = await Category.find({ 
        _id: categoryFilter, 
        isVisible: true 
      }).sort({ title: 1 });
    } else {
      categories = await Category.find({ isVisible: true }).sort({ title: 1 });
    }

    const coursesByCategory = [];

    for (const category of categories) {
      // Build query for courses in this category
      let courseQuery = {
        category: category._id
      };

      // Apply status filter
      if (status === 'listed') {
        courseQuery.listed = true;
      } else if (status === 'unlisted') {
        courseQuery.listed = false;
      } else if (status === 'active') {
        courseQuery.isActive = true;
        courseQuery.isBanned = false;
      }

      // Build aggregation pipeline
      let pipeline = [
        { $match: courseQuery },
        {
          $lookup: {
            from: 'tutors',
            localField: 'tutor',
            foreignField: '_id',
            as: 'tutorInfo'
          }
        },
        {
          $match: {
            'tutorInfo.is_blocked': { $ne: true }
          }
        }
      ];

      // Add search filter if provided
      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          }
        });
      }

      // Add price filter if provided
      if (minPrice !== null || maxPrice !== null) {
        const priceMatch = {};
        if (minPrice !== null) priceMatch.$gte = minPrice;
        if (maxPrice !== null) priceMatch.$lte = maxPrice;
        pipeline.push({
          $match: {
            price: priceMatch
          }
        });
      }

      // Add rating filter if provided
      if (rating !== 'all') {
        const minRating = parseInt(rating.replace('+', ''));
        pipeline.push({
          $match: {
            average_rating: { $gte: minRating }
          }
        });
      }

      // Add projection and sorting
      pipeline.push(
        {
          $project: {
            title: 1,
            description: 1,
            price: 1,
            offer_percentage: 1,
            course_thumbnail: 1,
            average_rating: 1,
            total_reviews: 1,
            enrolled_count: 1,
            listed: 1,
            isActive: 1,
            isBanned: 1,
            createdAt: 1,
            tutor: {
              $arrayElemAt: ['$tutorInfo', 0]
            }
          }
        },
        {
          $project: {
            title: 1,
            description: 1,
            price: 1,
            offer_percentage: 1,
            course_thumbnail: 1,
            average_rating: 1,
            total_reviews: 1,
            enrolled_count: 1,
            listed: 1,
            isActive: 1,
            isBanned: 1,
            createdAt: 1,
            'tutor.full_name': 1,
            'tutor.profileImage': 1
          }
        },
        { $sort: { createdAt: -1 } }
      );

      const courses = await Course.aggregate(pipeline);

      if (courses.length > 0) {
        const formattedCourses = courses.map((course) => ({
          id: course._id,
          title: course.title,
          description: course.description,
          price: course.price,
          offer_percentage: course.offer_percentage,
          course_thumbnail: course.course_thumbnail,
          average_rating: course.average_rating || 0,
          total_reviews: course.total_reviews || 0,
          enrolled_count: course.enrolled_count || 0,
          listed: course.listed,
          isActive: course.isActive,
          isBanned: course.isBanned,
          tutor: {
            full_name: course.tutor?.full_name || 'Unknown',
            profileImage: course.tutor?.profileImage
          },
          createdAt: course.createdAt
        }));

        coursesByCategory.push({
          id: category._id,
          title: category.title,
          description: category.description,
          courses: formattedCourses
        });
      }
    }

    res.status(200).json({
      success: true,
      coursesByCategory
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses"
    });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }

    const course = await Course.findById(courseId)
      .populate('category', 'title description')
      .populate('tutor', 'tutor_id full_name email profileImage is_blocked')
      .populate('lessons', 'title description duration');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const courseData = {
      _id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage,
      course_thumbnail: course.course_thumbnail,
      average_rating: course.average_rating || 0,
      total_reviews: course.total_reviews || 0,
      enrolled_count: course.enrolled_count || 0,
      listed: course.listed,
      isActive: course.isActive,
      isBanned: course.isBanned,
      category: course.category,
      tutor: course.tutor,
      lessons: course.lessons || [],
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };

    res.status(200).json({
      success: true,
      course: courseData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch course details"
    });
  }
};

const toggleCourseListing = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    course.listed = !course.listed;
    
    // If admin is unlisting the course, mark it as unlisted by admin
    if (!course.listed) {
      course.unlistedByAdmin = true;
    } else {
      // If admin is listing the course, remove the admin unlisted flag
      course.unlistedByAdmin = false;
    }
    
    await course.save();

    const action = course.listed ? "listed" : "unlisted";
    res.status(200).json({
      success: true,
      message: `Course ${action} successfully`,
      listed: course.listed
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update course listing status"
    });
  }
};

export {
  adminLogin,
  refreshAdminToken,
  getAllUsers,
  getAllTutors,
  blockUser,
  unblockUser,
  blockTutor,
  unblockTutor,
  getDashboardStats,
  getAdminProfile,
  updateAdminProfile,
  uploadAdminProfilePhoto,
  createAdmin,
  forgotPassword,
  resetPassword,
  checkAdminStatus,
  toggleCategoryVisibility,
  updateCategory,
  deleteCategory,
  getAllCategories,
  addcategory,
  getCoursesByCategory,
  getTutorDetails,
  getAllCourses,
  getCourseDetails,
  toggleCourseListing
};
