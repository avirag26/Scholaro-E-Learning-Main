import Admin from "../../Model/AdminModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/generateToken.js";
import { sendPasswordResetEmail } from "../../utils/emailService.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getCookieOptions } from "../../utils/cookieOptions.js";
import { STATUS_CODES } from "../../constants/constants.js";

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid email or password" });
    }
    if (admin.is_blocked) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Your account has been blocked" });
    }
    const isPasswordValid = await admin.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid email or password" });
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
    res.cookie('adminRefreshToken', refreshToken, getCookieOptions());
    res.status(STATUS_CODES.OK).json({
      message: "Login successful",
      accessToken,
      admin: adminInfo
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error during login" });
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
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Invalid refresh token" });
    }
    const newAccessToken = generateAccessToken(admin._id);
    const newRefreshToken = generateRefreshToken(admin._id);
    admin.refreshToken = newRefreshToken;
    await admin.save();
    res.cookie('adminRefreshToken', newRefreshToken, getCookieOptions());
    res.status(STATUS_CODES.OK).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { full_name, email, password, role = 'admin' } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Admin already exists" });
    }
    const admin = new Admin({
      full_name,
      email,
      password,
      role,
      admin_id: uuidv4()
    });
    await admin.save();
    res.status(STATUS_CODES.CREATED).json({
      message: "Admin created successfully",
      admin: {
        _id: admin._id,
        name: admin.full_name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Admin not found" });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    admin.passwordResetToken = resetToken;
    admin.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await admin.save();
    await sendPasswordResetEmail(email, resetToken, 'admin');
    res.status(STATUS_CODES.OK).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Reset token is required" });
    }
    if (!password) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "New password is required" });
    }
    const admin = await Admin.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    if (!admin) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid or expired reset token" });
    }
    admin.password = password;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    await admin.save();
    res.status(STATUS_CODES.OK).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const checkAdminStatus = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('is_blocked');
    if (!admin) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Admin not found" });
    }
    if (admin.is_blocked) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Account blocked", blocked: true });
    }
    res.status(STATUS_CODES.OK).json({ message: "Account active", blocked: false });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

export {
  adminLogin,
  refreshAdminToken,
  createAdmin,
  forgotPassword,
  resetPassword,
  checkAdminStatus
};
