import Tutor from "../Model/TutorModel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";
import { v4 as uuidv4 } from "uuid";
import crypto from 'crypto';
import bcrypt from "bcryptjs";
import { OAuth2Client } from 'google-auth-library';
import { sendOtpToEmail, verifyEmailOtp, sendOtpWithData, verifyOtpWithData } from '../utils/otpService.js';

const registerTutor = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;
    let tutor = await Tutor.findOne({ email });

    if (tutor && tutor.is_verified) {
      return res.status(400).json({ message: "Tutor already exists" });
    }

    if (tutor && !tutor.is_verified) {
      tutor.full_name = full_name;
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
        full_name,
        email,
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

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const tutor = await Tutor.findOne({ refreshToken });

    if (!tutor) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(tutor._id);
    const newRefreshToken = generateRefreshToken(tutor._id);

    tutor.refreshToken = newRefreshToken;
    await tutor.save();

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const forgotTutorPassword = async (req, res) => {
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

    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetTutorPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const tutor = await Tutor.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!tutor) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    tutor.password = await bcrypt.hash(newPassword, salt);
    tutor.passwordResetToken = undefined;
    tutor.passwordResetExpires = undefined;
    await tutor.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getTutorProfile = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.tutor._id).select('-password -refreshToken');

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    res.status(200).json({
      tutor: {
        _id: tutor._id,
        name: tutor.full_name,
        email: tutor.email,
        phone: tutor.phone,
        subjects: tutor.subjects,
        bio: tutor.bio,
        profileImage: tutor.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateTutorProfile = async (req, res) => {
  try {
    const { name, phone, subjects, bio } = req.body;
    const tutorId = req.tutor._id;

    const tutor = await Tutor.findById(tutorId);

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (name) tutor.full_name = name;
    if (phone) tutor.phone = phone;
    if (subjects) tutor.subjects = subjects;
    if (bio) tutor.bio = bio;

    await tutor.save();

    res.status(200).json({
      message: "Profile updated successfully",
      tutor: {
        _id: tutor._id,
        name: tutor.full_name,
        email: tutor.email,
        phone: tutor.phone,
        subjects: tutor.subjects,
        bio: tutor.bio,
        profileImage: tutor.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const sendTutorEmailChangeOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const tutorId = req.tutor._id;

    if (!newEmail) {
      return res.status(400).json({
        message: "New email is required"
      });
    }

    const existingTutor = await Tutor.findOne({ email: newEmail });
    if (existingTutor) {
      return res.status(400).json({
        message: "Email is already taken by another tutor"
      });
    }

    const otpResult = await sendOtpWithData(newEmail, 'email-change', {
      userId: tutorId.toString(),
      newEmail: newEmail,
      userType: 'tutor'
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

const verifyTutorEmailChangeOtp = async (req, res) => {
  try {
    const { otp, newEmail } = req.body;
    const tutorId = req.tutor._id;

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

    if (verifyResult.data.userId !== tutorId.toString()) {
      return res.status(400).json({
        message: "Invalid OTP for this tutor"
      });
    }

    const tutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { email: newEmail },
      { new: true }
    ).select('-password');

    if (!tutor) {
      return res.status(404).json({
        message: "Tutor not found"
      });
    }

    res.status(200).json({
      message: "Email changed successfully",
      tutor: {
        _id: tutor._id,
        name: tutor.full_name,
        email: tutor.email,
        phone: tutor.phone,
        subjects: tutor.subjects,
        bio: tutor.bio,
        profileImage: tutor.profileImage
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
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

const uploadTutorProfilePhoto = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const tutorId = req.tutor._id;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }


    try {
      new URL(imageUrl);
    } catch (error) {
      return res.status(400).json({ message: "Invalid image URL format" });
    }

    const tutor = await Tutor.findById(tutorId);

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    tutor.profileImage = imageUrl;
    await tutor.save();

    res.status(200).json({
      message: "Profile photo updated successfully",
      profileImage: tutor.profileImage
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while uploading profile photo" });
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

    const tutor = await Tutor.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!tutor) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    tutor.password = await bcrypt.hash(newPassword, salt);
    tutor.passwordResetToken = undefined;
    tutor.passwordResetExpires = undefined;
    await tutor.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const sendTutorPasswordChangeOtp = async (req, res) => {
  try {
    const tutor = req.tutor;

    await sendOtpToEmail(tutor.email, 'password-change');

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

const changeTutorPasswordWithOtp = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const tutor = req.tutor;

    if (!otp || !newPassword) {
      return res.status(400).json({
        message: "OTP and new password are required"
      });
    }

    const otpResult = await verifyEmailOtp(tutor.email, otp, 'password-change');

    if (!otpResult.success) {
      return res.status(400).json({
        message: otpResult.message
      });
    }

    const tutorDoc = await Tutor.findById(tutor._id);
    const salt = await bcrypt.genSalt(10);
    tutorDoc.password = await bcrypt.hash(newPassword, salt);
    await tutorDoc.save();

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

export { 
  registerTutor, 
  verifyTutorOtp, 
  loginTutor, 
  resendTutorOtp, 
  googleAuthTutor, 
  refreshTutorToken, 
  forgotTutorPassword, 
  resetTutorPassword, 
  getTutorProfile, 
  updateTutorProfile,
  sendTutorEmailChangeOtp,
  verifyTutorEmailChangeOtp,
  checkTutorStatus,
  uploadTutorProfilePhoto,
  forgotPassword,
  resetPassword,
  sendTutorPasswordChangeOtp,
  changeTutorPasswordWithOtp
};