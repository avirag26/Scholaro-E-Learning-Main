import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: true,
    },
    admin_id: {
      type: String,
      required: true,
      unique: true
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin'],
      default: 'admin'
    },
    profile_image: {
      type: String,
      default: null,
    },
    status: {
      type: Boolean,
      default: true
    },
    is_blocked: {
      type: Boolean,
      default: false
    },
    refreshToken: {
      type: String,
      default: null
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    lastActive: { type: Date },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// This middleware will run before an admin document is saved.
adminSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with the hashed password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.index({ email: 1 });

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;