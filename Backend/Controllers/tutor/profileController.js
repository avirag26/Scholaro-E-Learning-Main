import Tutor from "../../Model/TutorModel.js";
import bcrypt from "bcryptjs";
import { sendOtpToEmail, verifyEmailOtp, sendOtpWithData, verifyOtpWithData } from '../../utils/otpService.js';

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

    // Validate subjects if provided
    if (subjects) {
      if (!Array.isArray(subjects)) {
        return res.status(400).json({ message: "Subjects must be an array" });
      }
      if (subjects.length > 10) {
        return res.status(400).json({ message: "Cannot have more than 10 subjects" });
      }
      for (const subject of subjects) {
        if (typeof subject !== 'string') {
          return res.status(400).json({ message: "Each subject must be a string" });
        }
        if (subject.length > 50) {
          return res.status(400).json({ message: "Each subject cannot exceed 50 characters" });
        }
        if (subject.includes('_')) {
          return res.status(400).json({ message: "Subjects cannot contain underscores" });
        }
        if (!/^[a-zA-Z0-9\s\-\.\:\(\)]+$/.test(subject)) {
          return res.status(400).json({ message: "Subjects can only contain letters, numbers, spaces, and basic punctuation (- . : ( ))" });
        }
      }
    }

    // Validate bio if provided
    if (bio) {
      if (bio.length > 500) {
        return res.status(400).json({ message: "Bio cannot exceed 500 characters" });
      }
      if (!/^[a-zA-Z0-9\s\-\.\,\:\(\)\!\?\'\"\n\r]+$/.test(bio)) {
        return res.status(400).json({ message: "Bio contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed." });
      }
    }

    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    if (name) tutor.full_name = name.trim();
    if (phone) tutor.phone = phone;
    if (subjects) tutor.subjects = subjects.map(subject => subject.trim()).filter(subject => subject.length > 0);
    if (bio) tutor.bio = bio.trim();
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

export {
  getTutorProfile,
  updateTutorProfile,
  uploadTutorProfilePhoto,
  sendTutorPasswordChangeOtp,
  changeTutorPasswordWithOtp,
  sendTutorEmailChangeOtp,
  verifyTutorEmailChangeOtp
};