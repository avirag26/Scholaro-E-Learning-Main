import User from "../Model/usermodel.js";
import { Course } from "../Model/CourseModel.js";
import Category from "../Model/CategoryModel.js";
import Lesson from "../Model/LessonModel.js";
import Tutor from "../Model/TutorModel.js";
import mongoose from "mongoose";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from "../utils/emailService.js";
import { OAuth2Client } from 'google-auth-library';
import { sendOtpToEmail, verifyEmailOtp, sendOtpWithData, verifyOtpWithData } from '../utils/otpService.js';
const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;
    let user = await User.findOne({ email });
    if (user && user.is_verified) {
      return res.status(400).json({ message: "User already exists" });
    }
    if (user && !user.is_verified) {
      user.full_name = full_name;
      user.phone = phone;
      user.password = password;
      await user.save();
    } else {
      user = new User({
        full_name,
        email,
        phone,
        password,
        user_id: uuidv4(),
        is_verified: false
      });
      await user.save();
    }
    await sendOtpToEmail(email, 'user');
    res.status(201).json({ message: "OTP sent to your Email" });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    if (!user.is_verified) {
      return res.status(400).json({ message: "Please verify your email first" });
    }
    if (user.is_blocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    const userInfo = {
      _id: user._id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage
    };
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: userInfo
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const otpResult = await verifyEmailOtp(email, otp, 'user');
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }
    user.is_verified = true;
    await user.save();
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    const userInfo = {
      _id: user._id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage
    };
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(200).json({
      message: "Email verified successfully",
      accessToken,
      user: userInfo
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during verification" });
  }
};
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.is_verified) {
      return res.status(400).json({ message: "User is already verified" });
    }
    await sendOtpToEmail(email, 'user');
    return res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    let user = await User.findOne({ email });
    if (user && user.is_blocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }
    if (!user) {
      user = new User({
        full_name: name,
        email,
        googleId: payload.sub,
        profileImage: picture,
        is_verified: true,
        user_id: uuidv4()
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.is_verified = true;
      if (!user.profileImage) {
        user.profileImage = picture;
      }
      await user.save();
    }
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    const userInfo = {
      _id: user._id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage
    };
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(200).json({
      message: "Google authentication successful",
      accessToken,
      user: userInfo
    });
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed" });
  }
};
const refreshToken = async (req, res) => {
  try {
    const refreshTokenFromCookie = req.cookies.refreshToken;
    if (!refreshTokenFromCookie) {
      return res.status(401).json({ message: "Refresh token required" });
    }
    const user = await User.findOne({ refreshToken: refreshTokenFromCookie });
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();
    res.cookie('refreshToken', newRefreshToken, {
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
const logoutUser = async (req, res) => {
  try {
    const refreshTokenFromCookie = req.cookies.refreshToken;
    if (refreshTokenFromCookie) {
      await User.findOneAndUpdate(
        { refreshToken: refreshTokenFromCookie },
        { $unset: { refreshToken: 1 } }
      );
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(200).json({
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during logout" });
  }
};
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        wallet: user.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const updateUserProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.full_name = name;
    if (phone) user.phone = phone;
    await user.save();
    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const uploadProfilePhoto = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user._id;
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }
    try {
      new URL(imageUrl);
    } catch (error) {
      return res.status(400).json({ message: "Invalid image URL format" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.profileImage = imageUrl;
    await user.save();
    res.status(200).json({
      message: "Profile photo updated successfully",
      profileImage: user.profileImage
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while uploading profile photo" });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendPasswordResetEmail(email, resetToken, 'user');
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
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const checkUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('is_blocked');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.is_blocked) {
      return res.status(403).json({ message: "Account blocked", blocked: true });
    }
    res.status(200).json({ message: "Account active", blocked: false });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
const sendPasswordChangeOtp = async (req, res) => {
  try {
    const user = req.user;
    await sendOtpToEmail(user.email, 'password-change');
    res.status(200).json({
      message: "OTP sent to your email address"
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
const changePasswordWithOtp = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const user = req.user;
    if (!otp || !newPassword) {
      return res.status(400).json({
        message: "OTP and new password are required"
      });
    }
    const otpResult = await verifyEmailOtp(user.email, otp, 'password-change');
    if (!otpResult.success) {
      return res.status(400).json({
        message: otpResult.message
      });
    }
    const userDoc = await User.findById(user._id);
    userDoc.password = newPassword;
    await userDoc.save();
    res.status(200).json({
      message: "Password changed successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
const sendEmailChangeOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user._id;
    if (!newEmail) {
      return res.status(400).json({
        message: "New email is required"
      });
    }
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "Email is already taken by another user"
      });
    }
    const otpResult = await sendOtpWithData(newEmail, 'email-change', {
      userId: userId.toString(),
      newEmail: newEmail,
      userType: 'user'
    });
    if (!otpResult.success) {
      return res.status(500).json({
        message: otpResult.message
      });
    }
    res.status(200).json({
      message: "OTP sent to your new email address"
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
const verifyEmailChangeOtp = async (req, res) => {
  try {
    const { otp, newEmail } = req.body;
    const userId = req.user._id;
    if (!otp || !newEmail) {
      return res.status(400).json({
        message: "OTP and new email are required"
      });
    }
    const verifyResult = await verifyOtpWithData(newEmail, otp, 'email-change');
    if (!verifyResult.success) {
      return res.status(400).json({
        message: verifyResult.message
      });
    }
    if (verifyResult.data.userId !== userId.toString()) {
      return res.status(400).json({
        message: "Invalid OTP for this user"
      });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { email: newEmail },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    res.status(200).json({
      message: "Email changed successfully",
      user: {
        _id: user._id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
const getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isVisible: true })
      .select('title description')
      .sort({ title: 1 });
    const formattedCategories = categories.map(category => ({
      id: category._id,
      title: category.title,
      description: category.description
    }));
    res.status(200).json({
      success: true,
      categories: formattedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories"
    });
  }
};
const getPublicCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const rating = req.query.rating ? parseFloat(req.query.rating) : null;
    const sort = req.query.sort || 'newest';
    let matchStage = {
      listed: true,
      isActive: true,
      isBanned: false
    };
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      matchStage.category = new mongoose.Types.ObjectId(category);
    }
    if (minPrice !== null || maxPrice !== null) {
      matchStage.price = {};
      if (minPrice !== null) matchStage.price.$gte = minPrice;
      if (maxPrice !== null) matchStage.price.$lte = maxPrice;
    }
    if (rating !== null) {
      matchStage.average_rating = { $gte: rating };
    }
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { average_rating: -1 };
        break;
      case 'popular':
        sortOption = { enrolled_count: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
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
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          tutor: {
            $arrayElemAt: ['$tutorInfo', 0]
          },
          category: {
            $arrayElemAt: ['$categoryInfo', 0]
          }
        }
      },
      {
        $project: {
          tutorInfo: 0,
          categoryInfo: 0,
          'tutor.password': 0,
          'tutor.refreshToken': 0,
          'tutor.passwordResetToken': 0,
          'tutor.passwordResetExpires': 0
        }
      },
      { $sort: sortOption },
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
      category: course.category,
      tutor: {
        _id: course.tutor._id,
        full_name: course.tutor.full_name,
        profileImage: course.tutor.profileImage
      },
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count,
      average_rating: course.average_rating,
      total_reviews: course.total_reviews,
      createdAt: course.createdAt,
    }));
    res.status(200).json({
      success: true,
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
      message: "Failed to fetch courses",
      error: error.message
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
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const rating = req.query.rating ? parseFloat(req.query.rating) : null;
    const sort = req.query.sort || 'newest';
    
    const category = await Category.findOne({
      _id: categoryId,
      isVisible: true
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or not available"
      });
    }
    
    let matchStage = {
      category: new mongoose.Types.ObjectId(categoryId),
      listed: true,
      isActive: true,
      isBanned: false
    };
    
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice !== null || maxPrice !== null) {
      matchStage.price = {};
      if (minPrice !== null) matchStage.price.$gte = minPrice;
      if (maxPrice !== null) matchStage.price.$lte = maxPrice;
    }
    
    if (rating !== null) {
      matchStage.average_rating = { $gte: rating };
    }
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { average_rating: -1 };
        break;
      case 'popular':
        sortOption = { enrolled_count: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
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
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          tutor: {
            $arrayElemAt: ['$tutorInfo', 0]
          },
          category: {
            $arrayElemAt: ['$categoryInfo', 0]
          }
        }
      },
      {
        $project: {
          tutorInfo: 0,
          categoryInfo: 0,
          'tutor.password': 0,
          'tutor.refreshToken': 0,
          'tutor.passwordResetToken': 0,
          'tutor.passwordResetExpires': 0
        }
      },
      { $sort: sortOption },
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
      category: course.category,
      tutor: {
        _id: course.tutor._id,
        full_name: course.tutor.full_name,
        profileImage: course.tutor.profileImage
      },
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count,
      average_rating: course.average_rating,
      total_reviews: course.total_reviews,
      createdAt: course.createdAt,
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
      message: "Failed to fetch courses by category",
      error: error.message
    });
  }
};
const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format"
      });
    }
    let course = await Course.findOne({
      _id: courseId,
      listed: true,
      isActive: true,
      isBanned: false
    })
      .populate('category', 'title description')
      .populate('tutor', 'full_name profileImage email bio is_blocked')
      .populate('lessons', 'title description duration');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or not available"
      });
    }
    if (course.tutor && course.tutor.is_blocked) {
      return res.status(404).json({
        success: false,
        message: "Course not found or not available"
      });
    }
    const formattedCourse = {
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage || 0,
      category: course.category,
      tutor: course.tutor,
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count || 0,
      average_rating: course.average_rating || 0,
      total_reviews: course.total_reviews || 0,
      lessons: course.lessons || [],
      createdAt: course.createdAt,
    };
    res.status(200).json({
      success: true,
      course: formattedCourse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch course details",
      error: error.message
    });
  }
};
const getPublicTutors = async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', subject = '' } = req.query;
    let query = { is_verified: true, is_blocked: false };
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { subjects: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    if (subject) {
      query.subjects = { $regex: subject, $options: 'i' };
    }
    const tutors = await Tutor.find(query)
      .select('full_name email subjects bio profileImage createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Tutor.countDocuments(query);
    const transformedTutors = tutors.map(tutor => ({
      _id: tutor._id,
      name: tutor.full_name,
      email: tutor.email,
      subjects: tutor.subjects || 'Tutor',
      bio: tutor.bio || 'Experienced tutor ready to help you learn',
      profileImage: tutor.profileImage || tutor.profile_image,
      createdAt: tutor.createdAt
    }));
    res.status(200).json({
      tutors: transformedTutors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch tutors",
      error: error.message 
    });
  }
};
const getTutorDetails = async (req, res) => {
  try {
    const { tutorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tutor ID format"
      });
    }
    const tutor = await Tutor.findOne({
      _id: tutorId,
      is_verified: true,
      is_blocked: false
    }).select('full_name email subjects bio profileImage createdAt');
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found or not available"
      });
    }
    const coursesPipeline = [
      {
        $match: {
          tutor: new mongoose.Types.ObjectId(tutorId),
          listed: true,
          isActive: true,
          isBanned: false
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: 'lessons',
          foreignField: '_id',
          as: 'lessonInfo'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryInfo', 0] },
          totalLessons: { $size: '$lessonInfo' },
          totalDuration: {
            $reduce: {
              input: '$lessonInfo',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $toInt: {
                      $arrayElemAt: [
                        { $split: ['$$this.duration', ':'] },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          categoryInfo: 0,
          lessonInfo: 0
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];
    const courses = await Course.aggregate(coursesPipeline);
    const totalStudents = courses.reduce((sum, course) => sum + (course.enrolled_count || 0), 0);
    const totalCourses = courses.length;
    const averageRating = courses.length > 0 
      ? courses.reduce((sum, course) => sum + (course.average_rating || 0), 0) / courses.length 
      : 0;
    const formattedCourses = courses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage || 0,
      category: course.category,
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count || 0,
      average_rating: course.average_rating || 0,
      total_reviews: course.total_reviews || 0,
      totalLessons: course.totalLessons || 0,
      totalDuration: course.totalDuration || 0,
      createdAt: course.createdAt
    }));
    const tutorDetails = {
      id: tutor._id,
      name: tutor.full_name,
      email: tutor.email,
      subjects: tutor.subjects || 'Professional Tutor',
      bio: tutor.bio || 'Experienced educator passionate about helping students achieve their goals.',
      profileImage: tutor.profileImage,
      createdAt: tutor.createdAt,
      statistics: {
        totalStudents,
        totalCourses,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: courses.reduce((sum, course) => sum + (course.total_reviews || 0), 0)
      },
      courses: formattedCourses
    };
    res.status(200).json({
      success: true,
      tutor: tutorDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tutor details",
      error: error.message
    });
  }
};
const testBlockedTutorFilter = async (req, res) => {
  try {
    const allCourses = await Course.find({ listed: true, isActive: true, isBanned: false })
      .populate('tutor', 'full_name is_blocked');
    const blockedTutorCourses = allCourses.filter(course => course.tutor?.is_blocked === true);
    const nonBlockedTutorCourses = allCourses.filter(course => course.tutor?.is_blocked !== true);
    res.json({
      totalCourses: allCourses.length,
      blockedTutorCourses: blockedTutorCourses.length,
      nonBlockedTutorCourses: nonBlockedTutorCourses.length,
      blockedTutors: blockedTutorCourses.map(c => ({
        courseTitle: c.title,
        tutorName: c.tutor?.full_name,
        isBlocked: c.tutor?.is_blocked
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export {
  registerUser,
  verifyOtp,
  loginUser,
  logoutUser,
  resendOtp,
  googleAuth,
  refreshToken,
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  forgotPassword,
  resetPassword,
  checkUserStatus,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
  getPublicCategories,
  getPublicCourses,
  getCoursesByCategory,
  getCourseDetails,
  getPublicTutors,
  getTutorDetails,
  testBlockedTutorFilter
};
