import Tutor from "../../Model/TutorModel.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/generateToken.js";
import { sendPasswordResetEmail } from "../../utils/emailService.js";
import { v4 as uuidv4 } from "uuid";
import crypto from 'crypto';
import bcrypt from "bcryptjs";
import { OAuth2Client } from 'google-auth-library';
import { sendOtpToEmail, verifyEmailOtp } from '../../utils/otpService.js';

const registerTutor = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    // Validation
    if (!full_name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate full name
    if (full_name.length < 2 || full_name.length > 50) {
      return res.status(400).json({ message: "Name must be between 2 and 50 characters" });
    }
    if (!/^[a-zA-Z\s]+$/.test(full_name)) {
      return res.status(400).json({ message: "Name can only contain letters and spaces" });
    }
    if (/\d/.test(full_name)) {
      return res.status(400).json({ message: "Name cannot contain numbers" });
    }
    if (full_name.includes('_')) {
      return res.status(400).json({ message: "Name cannot contain underscores" });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Validate phone
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit Indian phone number starting with 6-9" });
    }

    // Validate password
    if (password.length < 8 || password.length > 30) {
      return res.status(400).json({ message: "Password must be between 8 and 30 characters" });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one lowercase letter" });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one uppercase letter" });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one number" });
    }
    if (!/[@$!%*?&]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one special character (@$!%*?&)" });
    }

    let tutor = await Tutor.findOne({ email });
    if (tutor && tutor.is_verified) {
      return res.status(400).json({ message: "Tutor already exists" });
    }
    if (tutor && !tutor.is_verified) {
      tutor.full_name = full_name.trim();
      tutor.phone = phone;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        tutor.password = await bcrypt.hash(password, salt);
      }
      await tutor.save();
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      tutor = new Tutor({
        full_name: full_name.trim(),
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        tutor_id: uuidv4(),
        is_verified: false
      });
      await tutor.save();
    }
    await sendOtpToEmail(email, 'tutor');
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
};

const verifyTutorOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const tutor = await Tutor.findOne({ email });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    const otpResult = await verifyEmailOtp(email, otp, 'tutor');
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }
    tutor.is_verified = true;
    await tutor.save();
    const accessToken = generateAccessToken(tutor._id);
    const refreshToken = generateRefreshToken(tutor._id);
    tutor.refreshToken = refreshToken;
    await tutor.save();
    const tutorInfo = {
      _id: tutor._id,
      name: tutor.full_name,
      email: tutor.email,
      phone: tutor.phone,
      subjects: tutor.subjects,
      bio: tutor.bio,
      profileImage: tutor.profileImage
    };
    res.status(200).json({
      message: "Email verified successfully",
      accessToken,
      refreshToken,
      tutor: tutorInfo
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during verification" });
  }
};

const loginTutor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const tutor = await Tutor.findOne({ email });
    if (!tutor) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    if (!tutor.is_verified) {
      return res.status(400).json({ message: "Please verify your email first" });
    }
    if (tutor.is_blocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }
    const isPasswordValid = await bcrypt.compare(password, tutor.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const accessToken = generateAccessToken(tutor._id);
    const refreshToken = generateRefreshToken(tutor._id);
    tutor.refreshToken = refreshToken;
    tutor.lastLogin = new Date();
    await tutor.save();
    const tutorInfo = {
      _id: tutor._id,
      name: tutor.full_name,
      email: tutor.email,
      phone: tutor.phone,
      subjects: tutor.subjects,
      bio: tutor.bio,
      profileImage: tutor.profileImage
    };
    res.cookie('tutorRefreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(200).json({
      message: "Login successful",
      accessToken,
      tutor: tutorInfo
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};

const resendTutorOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const tutor = await Tutor.findOne({ email });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    if (tutor.is_verified) {
      return res.status(400).json({ message: "Tutor is already verified" });
    }
    await sendOtpToEmail(email, 'tutor');
    res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const googleAuthTutor = async (req, res) => {
  try {
    const { credential } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    let tutor = await Tutor.findOne({ email });
    if (tutor && tutor.is_blocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }
    if (!tutor) {
      tutor = new Tutor({
        full_name: name,
        email,
        googleId: payload.sub,
        profileImage: picture,
        is_verified: true,
        tutor_id: uuidv4()
      });
      await tutor.save();
    } else if (!tutor.googleId) {
      tutor.googleId = payload.sub;
      tutor.is_verified = true;
      if (!tutor.profileImage) {
        tutor.profileImage = picture;
      }
      await tutor.save();
    }
    const accessToken = generateAccessToken(tutor._id);
    const refreshToken = generateRefreshToken(tutor._id);
    tutor.refreshToken = refreshToken;
    tutor.lastLogin = new Date();
    await tutor.save();
    const tutorInfo = {
      _id: tutor._id,
      name: tutor.full_name,
      email: tutor.email,
      phone: tutor.phone,
      subjects: tutor.subjects,
      bio: tutor.bio,
      profileImage: tutor.profileImage
    };
    res.status(200).json({
      message: "Google authentication successful",
      accessToken,
      refreshToken,
      tutor: tutorInfo
    });
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed" });
  }
};

const refreshTutorToken = async (req, res) => {
  try {
    const refreshTokenFromCookie = req.cookies.tutorRefreshToken;
    if (!refreshTokenFromCookie) {
      return res.status(401).json({ message: "Refresh token required" });
    }
    const tutor = await Tutor.findOne({ refreshToken: refreshTokenFromCookie });
    if (!tutor) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const newAccessToken = generateAccessToken(tutor._id);
    const newRefreshToken = generateRefreshToken(tutor._id);
    tutor.refreshToken = newRefreshToken;
    await tutor.save();
    res.cookie('tutorRefreshToken', newRefreshToken, {
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const tutor = await Tutor.findOne({ email });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    tutor.passwordResetToken = resetToken;
    tutor.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await tutor.save();
    await sendPasswordResetEmail(email, resetToken, 'tutor');
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
    const tutor = await Tutor.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    if (!tutor) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    const salt = await bcrypt.genSalt(10);
    tutor.password = await bcrypt.hash(password, salt);
    tutor.passwordResetToken = undefined;
    tutor.passwordResetExpires = undefined;
    await tutor.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const checkTutorStatus = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.tutor._id).select('is_blocked');
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    if (tutor.is_blocked) {
      return res.status(403).json({ message: "Account blocked", blocked: true });
    }
    res.status(200).json({ message: "Account active", blocked: false });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export {
  registerTutor,
  verifyTutorOtp,
  loginTutor,
  resendTutorOtp,
  googleAuthTutor,
  refreshTutorToken,
  forgotPassword,
  resetPassword,
  checkTutorStatus
};