import Tutor from "../Model/TutorModel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import {  sendPasswordResetEmail } from "../utils/emailService.js";
import { v4 as uuidv4 } from "uuid";
import crypto from 'crypto'
import bcrypt from "bcryptjs";
import { OAuth2Client } from 'google-auth-library';
import { createAndSendOTP, verifyOTP } from '../utils/otpService.js';


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


    await createAndSendOTP(email, 'tutor');
    
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error('Tutor registration error:', error);
    return res.status(500).json({ message: "Server error during registration" });
  }
}

const verifyTutorOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const tutor = await Tutor.findOne({ email });

    if (!tutor) {
      return res.status(400).json({ message: "Tutor not found" });
    }

    const otpResult = await verifyOTP(email, otp, 'tutor');
    
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }

    tutor.is_verified = true;
    await tutor.save();

    const refreshToken = generateRefreshToken(tutor._id);
    const accessToken = generateAccessToken(tutor._id);

    res.cookie("jwt_tutor", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, //30days
    });

    res.status(200).json({
      _id: tutor._id,
      name: tutor.full_name,
      email: tutor.email,
      accessToken: accessToken,
      message: "Tutor verified"
    });


  } catch (error) {
    res.status(500).json({ message: "Server error during OTP  verifying" })
  }
}


const loginTutor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const tutor = await Tutor.findOne({ email });

    if (!tutor) return res.status(400).json({ message: "Invalid email or password" })

    if (tutor && (await bcrypt.compare(password, tutor.password))) {
      if (!tutor.is_verified) {
        return res.status(400).json({ message: "Tutor not verified" });
      }
      if (tutor.is_blocked) {
        return res.status(403).json({
          message: "Your account has been blocked by the administrator. Please contact support.",
          blocked: true
        });
      }
      const accessToken = generateAccessToken(tutor._id);
      const refreshToken = generateRefreshToken(tutor._id);

      tutor.refreshToken = refreshToken;
      await tutor.save();
      res.cookie("jwt_tutor", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })
      res.status(200).json({
        _id: tutor._id,
        name: tutor.full_name,
        email: tutor.email,
        accessToken: accessToken,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during login" })
  }
}

const resendTutorOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const tutor = await Tutor.findOne({ email });

    if (!tutor || tutor.is_verified) {
      return res.status(400).json({ message: "Cannot resend OTP for this tutor." });
    }

    await createAndSendOTP(email, 'tutor');
    
    res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    console.error("Resend Tutor OTP Error:", error);
    res.status(500).json({ message: "Server error during OTP resend." });
  }
};

const googleAuthTutor = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let tutor = await Tutor.findOne({
      $or: [{ email }, { googleId }],
    });

    if (tutor) {
      if (tutor.is_blocked) {
        return res.status(403).json({
          message: "Your account has been blocked by the administrator. Please contact support.",
          blocked: true
        });
      }

      if (!tutor.googleId) {
        tutor.googleId = googleId;
        tutor.profile_image = picture;
        await tutor.save();
      }

      const accessToken = generateAccessToken(tutor._id);
      const refreshToken = generateRefreshToken(tutor._id);

      tutor.refreshToken = refreshToken;
      tutor.lastLogin = new Date();
      await tutor.save();

      res.cookie("jwt_tutor", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.json({
        _id: tutor._id,
        name: tutor.full_name,
        email: tutor.email,
        profileImage: tutor.profile_image,
        accessToken,
        message: "Google login successful",
      });
    }

    const newTutor = new Tutor({
      full_name: name,
      email,
      googleId,
      profile_image: picture,
      tutor_id: uuidv4(),
      is_verified: true,
    });

    await newTutor.save();

    const accessToken = generateAccessToken(newTutor._id);
    const refreshToken = generateRefreshToken(newTutor._id);

    newTutor.refreshToken = refreshToken;
    newTutor.lastLogin = new Date();
    await newTutor.save();

    res.cookie("jwt_tutor", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      _id: newTutor._id,
      name: newTutor.full_name,
      email: newTutor.email,
      profileImage: newTutor.profile_image,
      accessToken,
      message: "Google registration successful",
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    if (error.message.includes("Token used too early")) {
      return res.status(400).json({ message: "Invalid Google token. Please try again." });
    }
    res.status(500).json({ message: "Google authentication failed" });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const tutor = await Tutor.findOne({ email });

    if (!tutor) {
      return res.status(400).json({ message: "If the tutor is exists email have been send" })
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    tutor.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    tutor.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await tutor.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(tutor.email, resetToken, 'tutor');

    return res.status(200).json({ message: "PasPassword reset token sent to email" })
  } catch (error) {
    console.error("Forgot password error:", error);
    const { email } = req.body;
    const tutortoUpdate = await Tutor.findOne({ email });
    if (tutortoUpdate) {
      tutortoUpdate.passwordResetToken = undefined;
      tutortoUpdate.passwordResetExpires = undefined;
      await tutortoUpdate.save({ validateBeforeSave: false });

    }
    return res.status(500).json({ message: "There was an error sending the email. Try again later." })
  }

}

const resetPassword = async (req, res) => {

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const tutor = await Tutor.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  if (!tutor) {
    return res.status(400).json({ message: 'Token is invalid or has expired' });
  }
  const salt = await bcrypt.genSalt(10);
  tutor.password = await bcrypt.hash(req.body.password, salt);
  tutor.passwordResetToken = undefined;
  tutor.passwordResetExpires = undefined;
  await tutor.save();

  res.status(200).json({ message: 'Password reset successful.' });
};

const checkTutorStatus = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication invalid.' });
    }

    const tutor = await Tutor.findById(req.user._id);

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (tutor.is_blocked) {
      return res.status(403).json({ message: "Tutor is blocked by admin." });
    }

    res.status(200).json({ message: "Tutor is active." });
  } catch (error) {
    res.status(500).json({ message: 'Server error while checking status' });
  }
};

export { registerTutor, verifyTutorOtp, resendTutorOtp, loginTutor, googleAuthTutor, forgotPassword, resetPassword, checkTutorStatus }