import User from "../../Model/usermodel.js";
import { sendOtpToEmail, verifyEmailOtp, sendOtpWithData, verifyOtpWithData } from '../../utils/otpService.js';

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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.full_name = name.trim();
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

export {
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
  sendEmailChangeOtp,
  verifyEmailChangeOtp
};