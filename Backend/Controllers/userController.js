import User from "../Model/usermodel.js";
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

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
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

    res.status(200).json({
      message: "Email verified successfully",
      accessToken,
      refreshToken,
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

    res.status(200).json({
      message: "Google authentication successful",
      accessToken,
      refreshToken,
      user: userInfo
    });
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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

    // Basic URL validation
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

    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = newPassword;
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

export {
  registerUser,
  verifyOtp,
  loginUser,
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
  verifyEmailChangeOtp
};