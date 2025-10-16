import User from "../Model/usermodel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from "../utils/emailService.js";
import { OAuth2Client } from 'google-auth-library';
import { createAndSendOTP, verifyOTP } from '../utils/otpService.js';

const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    let user = await User.findOne({ email });


    if (user && user.is_verified) {
      return res.status(400).json({ message: "User already exists " });
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

    await createAndSendOTP(email, 'user');

    res.status(201).json({ message: "OTP sent to your Email" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Server error during registration" });
  }
}


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        message: "Your account has been blocked by the administrator. Please contact support.",
        blocked: true
      });
    }

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
      user.lastLogin = new Date();
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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otpResult = await verifyOTP(email, otp, 'user');

    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }

    user.is_verified = true;
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
      name: user.full_name,
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
      return res.status(400).json({ message: "Cannot send OTP to this user" });
    }

    await createAndSendOTP(email, 'user');

    return res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ message: "Server error during OTP resend" });
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
      entity = new Model({
        full_name: name,
        email,
        googleId,
        profileImage: picture,
        [`${userType}_id`]: uuidv4(),
        is_verified: true,
      });
    } else {
      if (entity.is_blocked) {
        return res.status(403).json({
          message: "Your account has been blocked by the administrator. Please contact support.",
          blocked: true
        });
      }

      if (!entity.googleId) entity.googleId = googleId;
      if (!entity.profileImage) entity.profileImage = picture;
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
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
    console.error(` Google Auth Error for ${userType}:`, error.message);
    if (error.message.includes('Token used too early') || error.message.includes('Invalid token') || error.message.includes('audience')) {
      return res.status(400).json({ message: 'Invalid Google token. Please try again.' });
    }
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

const googleAuth = async (req, res) => {
  await handleGoogleAuth(req, res, User, 'user');
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
    console.error("Forgot password error:", error);
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
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error during reset password" });
  }
};

const checkUserStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication invalid.' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.is_blocked) {
      return res.status(403).json({ message: "User is blocked by admin." });
    }

    res.status(200).json({ message: "User is active." });
  } catch (error) {
    res.status(500).json({ message: 'Server error while checking status' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, phone } = req.body;



    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already taken" });
      }
    }

    // Prepare update data - only include phone if it's provided
    const updateData = {
      full_name: name,
      email: email
    };

    // Only add phone to update if it's provided and not empty
    if (phone && phone.trim() !== '') {
      updateData.phone = phone;
    }



    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }



    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.full_name,
        email: updatedUser.email,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);

    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors
      });
    }

    res.status(500).json({ message: "Server error while updating profile" });
  }
};

const sendPasswordChangeOtp = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Send OTP for password change
    await createAndSendOTP(user.email, 'password-change');
    
    res.status(200).json({ 
      message: "OTP sent to your email for password change verification" 
    });
  } catch (error) {
    console.error('Send password change OTP error:', error);
    res.status(500).json({ message: "Server error while sending OTP" });
  }
};

const changePasswordWithOtp = async (req, res) => {
  try {
    const user = req.user;
    const { newPassword, otp } = req.body;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!newPassword || !otp) {
      return res.status(400).json({ message: "New password and OTP are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Verify OTP
    const otpResult = await verifyOTP(user.email, otp, 'password-change');
    
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }

    // Update password
    const userToUpdate = await User.findById(user._id);
    userToUpdate.password = newPassword;
    await userToUpdate.save();

    res.status(200).json({ 
      message: "Password changed successfully" 
    });
  } catch (error) {
    console.error('Change password with OTP error:', error);
    res.status(500).json({ message: "Server error while changing password" });
  }
};

export { registerUser, verifyOtp, loginUser, resendOtp, googleAuth, updateUserProfile, forgotPassword, resetPassword, checkUserStatus, sendPasswordChangeOtp, changePasswordWithOtp };
