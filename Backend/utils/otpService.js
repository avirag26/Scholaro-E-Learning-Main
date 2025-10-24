import OTP from '../Model/OtpModel.js';
import { generateOtp as generateOtpCode } from '../Helper/OtpHelper.js';
import { sendOtpEmail } from './emailService.js';

export const sendOtpToEmail = async (email, userType) => {
  try {
    await OTP.deleteMany({ email, userType });
    
    const otp = generateOtpCode();
    
    await OTP.create({
      email,
      otp,
      userType
    });
    
    await sendOtpEmail(email, otp);
    
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    throw new Error('Failed to send OTP');
  }
};

export const verifyEmailOtp = async (email, otp, userType) => {
  try {
    const otpRecord = await OTP.findOne({ email, userType });
    
    if (!otpRecord) {
      return { success: false, message: 'OTP not found or expired' };
    }
    
    if (otpRecord.otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }
    
    await OTP.deleteOne({ _id: otpRecord._id });
    
    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    throw new Error('Failed to verify OTP');
  }
};

export const sendOtpWithData = async (email, otpType, metadata = {}) => {
  try {
    await OTP.deleteMany({ email, userType: otpType });
    
    const otpCode = generateOtpCode();
    
    await OTP.create({
      email,
      otp: otpCode,
      userType: otpType,
      data: metadata
    });
    
    await sendOtpEmail(email, otpCode);
    
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to send OTP' };
  }
};

export const verifyOtpWithData = async (email, otp, otpType) => {
  try {
    const otpRecord = await OTP.findOne({ email, userType: otpType });
    
    if (!otpRecord) {
      return { success: false, message: 'OTP not found or expired' };
    }
    
    if (otpRecord.otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }
    
    const data = otpRecord.data || {};
    
    await OTP.deleteOne({ _id: otpRecord._id });
    
    return { success: true, message: 'OTP verified successfully', data };
  } catch (error) {
    return { success: false, message: 'Failed to verify OTP' };
  }
};