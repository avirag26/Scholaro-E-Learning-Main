import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['user', 'tutor', 'password-change'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // TTL: 10 minutes (600 seconds)
  }
});


otpSchema.index({ email: 1, userType: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;