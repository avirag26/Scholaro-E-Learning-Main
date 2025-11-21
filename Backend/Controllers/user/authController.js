import User from "../../Model/usermodel.js";
import mongoose from "mongoose";
import { generateAccessToken, generateRefreshToken } from "../../utils/generateToken.js";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { sendContact, sendPasswordResetEmail } from "../../utils/emailService.js";
import { OAuth2Client } from 'google-auth-library';
import { sendOtpToEmail, verifyEmailOtp, sendOtpWithData, verifyOtpWithData } from '../../utils/otpService.js';
import { getCookieOptions } from "../../utils/cookieOptions.js";
import { STATUS_CODES } from "../../constants/constants.js";

const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    // Validation
    if (!full_name || !email || !password || !phone) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "All fields are required" });
    }

    // Validate full name
    if (full_name.length < 2 || full_name.length > 50) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Name must be between 2 and 50 characters" });
    }
    if (!/^[a-zA-Z\s]+$/.test(full_name)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Name can only contain letters and spaces" });
    }
    if (/\d/.test(full_name)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Name cannot contain numbers" });
    }
    if (full_name.includes('_')) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Name cannot contain underscores" });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Please enter a valid email address" });
    }

    // Validate phone
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Please enter a valid 10-digit Indian phone number starting with 6-9" });
    }

    // Validate password
    if (password.length < 8 || password.length > 30) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Password must be between 8 and 30 characters" });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Password must contain at least one lowercase letter" });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Password must contain at least one uppercase letter" });
    }
    if (!/\d/.test(password)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Password must contain at least one number" });
    }
    if (!/[@$!%*?&]/.test(password)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Password must contain at least one special character (@$!%*?&)" });
    }

    let user = await User.findOne({ email });
    if (user && user.is_verified) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "User already exists" });
    }
    if (user && !user.is_verified) {
      user.full_name = full_name.trim();
      user.phone = phone;
      user.password = password;
      await user.save();
    } else {
      user = new User({
        full_name: full_name.trim(),
        email: email.toLowerCase(),
        phone,
        password,
        user_id: uuidv4(),
        is_verified: false
      });
      await user.save();
    }
    await sendOtpToEmail(email, 'user');
    res.status(STATUS_CODES.CREATED).json({ message: "OTP sent to your Email" });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error during registration" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('courses.course', '_id title');
    if (!user) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid email or password" });
    }
    if (!user.is_verified) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Please verify your email first" });
    }
    if (user.is_blocked) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Your account has been blocked" });
    }
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid email or password" });
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
      profileImage: user.profileImage,
      courses: user.courses || []
    };
    res.cookie('refreshToken', refreshToken, getCookieOptions());
    res.status(STATUS_CODES.OK).json({
      message: "Login successful",
      accessToken,
      user: userInfo
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error during login" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).populate('courses.course', '_id title');
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }
    const otpResult = await verifyEmailOtp(email, otp, 'user');
    if (!otpResult.success) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: otpResult.message });
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
      profileImage: user.profileImage,
      courses: user.courses || []
    };
    res.cookie('refreshToken', refreshToken, getCookieOptions());
    res.status(STATUS_CODES.OK).json({
      message: "Email verified successfully",
      accessToken,
      user: userInfo
    });
  } catch (error) {
    console.error('Error during OTP verification:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error during verification" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }
    if (user.is_verified) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "User is already verified" });
    }
    await sendOtpToEmail(email, 'user');
    return res.status(STATUS_CODES.OK).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
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
    let user = await User.findOne({ email }).populate('courses.course', '_id title');
    if (user && user.is_blocked) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Your account has been blocked" });
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
      profileImage: user.profileImage,
      courses: user.courses || []
    };
    res.cookie('refreshToken', refreshToken, getCookieOptions());
    res.status(STATUS_CODES.OK).json({
      message: "Google authentication successful",
      accessToken,
      user: userInfo
    });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Google authentication failed" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshTokenFromCookie = req.cookies.refreshToken;
    if (!refreshTokenFromCookie) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: "Refresh token required" });
    }
    const user = await User.findOne({ refreshToken: refreshTokenFromCookie });
    if (!user) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Invalid refresh token" });
    }
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      ...getCookieOptions()
    });
    res.status(STATUS_CODES.OK).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
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
    res.status(STATUS_CODES.OK).json({
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error during logout" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendPasswordResetEmail(email, resetToken, 'user');
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
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid or expired reset token" });
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(STATUS_CODES.OK).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const checkUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('is_blocked');
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }
    if (user.is_blocked) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Account blocked", blocked: true });
    }
    res.status(STATUS_CODES.OK).json({ message: "Account active", blocked: false });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const contact = async (req, res) => {
  try {
    console.log("contact page hit");

    const { name, email, subject, message } = req.body;

    const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br>${message}</p>
    `;

    // Send the mail to your support inbox (or admin)
    await sendContact(process.env.EMAIL_USERNAME, subject, emailHtml);

    res.status(STATUS_CODES.OK).json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("Mail error:", err.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to send message" });
  }
};

export {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  googleAuth,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  checkUserStatus,
  contact
};
