import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    default: 'Notification message'
  },
  read: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: function () { return !this.googleId; },
      sparse: true
    },
    password: {
      type: String,
      required: function () { return !this.googleId; },
    },
    user_id: {
      type: String,
      required: true,
      unique: true
    },
    googleId: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null
    },
    status: {
      type: Boolean,
      default: true
    },
    courses: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "courses" },
        enrollmentDate: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 },
        completionStatus: { type: Boolean, default: false },
        completedLessons: [{ 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "lessons" 
        }]
      }
    ],
    wallet: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"]
    },
    refreshToken: {
      type: String,
      default: null
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    is_blocked: {
      type: Boolean,
      default: false
    },
    lastActive: { type: Date },
    lastLogin: { type: Date },
    notifications: [notificationSchema],
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model('User', userSchema);
export default User;
