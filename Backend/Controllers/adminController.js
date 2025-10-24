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

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      admin: adminInfo
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};

const refreshAdminToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const admin = await Admin.findOne({ refreshToken });

    if (!admin) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(admin._id);
    const newRefreshToken = generateRefreshToken(admin._id);

    admin.refreshToken = newRefreshToken;
    await admin.save();

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
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
        unlisted: await User.countDocuments({ is_blocked: true })
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

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (name) admin.full_name = name;
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

    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const admin = await Admin.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    admin.password = newPassword;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
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

const addcategory = async(req,res)=>{
  const {title , description} = req.body;

  if(!title || !description){
    return res.status(400).json({message:"Title and Description are requires"});
  }
  try {
    const category = new Category({title , description});
    await category.save();
    res.status(201).json({message:"Category Added Successfully ", category});
  } catch (error){
    res.status(500).json({message:"Failed to create category"});
  }
}

const getAllCategories = async (req,res) =>{
  try{
    const skipPagination = req.query.all === "true";

    if(skipPagination) {
      const categories = await Category.find().sort({createdAt:-1});

      const formattedCategories = categories.map((category)=>({
         id: category._id,
        title: category.title,
        description: category.description,
        isVisible: category.isVisible,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }));

      return res.json({
      categories:formattedCategories,
      pagination:null,
    })

    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find()
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

    
  } catch (error){
    return res.status(500).json({message:"Failed to fetch Categories"})
  }
}

const updateCategory = async (req,res) =>{
  const {id} =req.params;
  const {title , description} = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    const category = await Category.findByIdAndUpdate(
      id,
      {title, description},
      {new:true}
    );

    if(!category){
      return res.status(404).json({message:"Category not found"});
    }

    res.status(200).json({message:"Category updted successfully",category});
  } catch (error) {
    res.status(500).json({ message: "Failed to update category" });
  }
}

const deleteCategory = async (req,res) =>{
  const {id} = req.params;

  try{
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);

    if(!category) return res.status(404).json({message:"Category not found"});


    category.isVisible = !category.isVisible;
    await category.save();

    const action = category.isVisible ? "listed" : "unlisted";
    res.status(200).json({
      message: `Category ${action} successfully`,
      category
    });
  } catch(error){
    res.status(500).json({message:"Failed to update category visibility"});
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
      message: `Category visibility updated to ${
        category.isVisible ? "visible" : "hidden"
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
  addcategory
};