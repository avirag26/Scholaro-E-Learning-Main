import User from "../Model/usermodel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { sendOtpEmail, sendPasswordResetEmail } from "../utils/emailService.js";
import { OAuth2Client } from 'google-auth-library';
import { generateOtp } from '../Helper/OtpHelper.js'

const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    let user = await User.findOne({ email });

    if (user && user.is_verified) {
      return res.status(400).json({ message: "User already axist and verified" });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (user && !user.is_verified) {
      user.otp = otp,
        user.otpExpiry = otpExpiry,
        await user.save();
    }
    else {
      user = new User({
        full_name,
        email,
        phone,
        password,
        user_id: uuidv4(),
        otp,
        otpExpiry,
      });
      await user.save();
    }
    await sendOtpEmail(email, otp);

    res.status(201).json({ message: "OTP sent to your Email" })
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" })
  }
}


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        message: "Your account has been blocked by the administrator. Please contact support.",
        blocked: true
      });
    }

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(401).json({
        message: "Please verify your email before logging in.",
        verified: false
      });
    }

    if (await user.matchPassword(password)) {
      const refreshToken = generateRefreshToken(user._id);
      const accessToken = generateAccessToken(user._id);

      user.refreshToken = refreshToken;
      user.lastLogin = new Date(); // Track last login
      await user.save();

      res.cookie('jwt', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 1000, //30 days
      })
      res.json({
        _id: user._id,
        name: user.full_name,
        email: user.email,
        accessToken: accessToken,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" })
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error while login" })
  }
}




const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Missing await here - this was the main issue!
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if OTP has expired (should be < not >=)
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Check if OTP matches
    if (otp !== user.otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Verify the user
    user.is_verified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const refreshToken = generateRefreshToken(user._id);
    const accessToken = generateAccessToken(user._id);

    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      _id: user._id,
      name: user.full_name, // Fixed syntax error
      email: user.email,
      accessToken: accessToken,
      message: "User verified successfully",
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.is_verified) {
      return res.status(400).json({ message: "Cannot send otp to this user" });

    }
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOtpEmail(email, otp);
    return res.status(200).json({ message: "A new OTP is sent to yourr email." });
  } catch (error) {
    return res.status(500).json({ message: "Server error during OTP resend" })
  }
}


const handleGoogleAuth = async (req, res, Model, userType) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let entity = await Model.findOne({ $or: [{ email }, { googleId }] });

    if (!entity) {
      // Create new entity
      entity = new Model({
        full_name: name,
        email,
        googleId,
        profileImage: picture, // Ensure model field is 'profileImage'
        [`${userType}_id`]: uuidv4(),
        is_verified: true,
      });
    } else {
      // Update existing entity
      if (!entity.googleId) entity.googleId = googleId;
      if (!entity.profileImage) entity.profileImage = picture; // Only update if not present
    }

    const accessToken = generateAccessToken(entity._id);
    const refreshToken = generateRefreshToken(entity._id);
    entity.refreshToken = refreshToken;
    entity.lastLogin = new Date();
    await entity.save();

    const cookieName = userType === 'tutor' ? 'jwt_tutor' : 'jwt';
    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(entity.isNew ? 201 : 200).json({
      _id: entity._id,
      name: entity.full_name,
      email: entity.email,
      profileImage: entity.profileImage,
      accessToken,
      message: `Google ${entity.isNew ? 'registration' : 'login'} successful`,
    });
  } catch (error) {
    console.error(`❌ Google Auth Error for ${userType}:`, error.message);
    if (error.message.includes('Token used too early') || error.message.includes('Invalid token') || error.message.includes('audience')) {
      return res.status(400).json({ message: 'Invalid Google token. Please try again.' });
    }
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

const googleAuth = async (req, res) => {
  try {
    await handleGoogleAuth(req, res, User, 'user');
  } catch (error) {
    console.error('❌ Google Auth Error:', error.message);
    console.error('Error details:', error);

    if (error.message.includes('Token used too early')) {
      return res.status(400).json({ message: 'Invalid Google token. Please try again.' });
    }
    if (error.message.includes('Invalid token')) {
      return res.status(400).json({ message: 'Invalid Google token format.' });
    }
    if (error.message.includes('audience')) {
      return res.status(400).json({ message: 'Google Client ID mismatch.' });
    }

    return res.status(500).json({ message: 'An unexpected error occurred during Google authentication.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest("hex");

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;


    await user.save({ validateBeforeSave: false })

    await sendPasswordResetEmail(user.email, resetToken, 'user');

    return res.status(200).json({ message: " Send password reset tocken " })

  } catch (error) {
    const { email } = req.body;
    if (email) {

      const usertoupdate = await User.findOne({ email });
      if (usertoupdate) {
        usertoupdate.passwordResetToken = undefined;
        usertoupdate.passwordResetExpires = undefined;
        await usertoupdate.save({ validateBeforeSave: false });
      }
    }
    return res.status(500).json({ message: "Error for sending the email" })
  }
}




const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // Use findOne instead of find
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid or expired" });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // Missing await

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error during reset password" });
  }
};

export { registerUser, verifyOtp, loginUser, resendOtp, googleAuth, forgotPassword, resetPassword };
