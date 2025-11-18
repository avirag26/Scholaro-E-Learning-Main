import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const certificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'courses',
    required: true
  },
  examAttemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamAttempt',
    required: true
  },
  certificateId: {
    type: String,
    unique: true,
    required: true,
    default: () => uuidv4()
  },
  verificationCode: {
    type: String,
    unique: true,
    required: true,
    default: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  },
  certificateUrl: {
    type: String // URL to generated PDF
  },
  cloudinaryPublicId: {
    type: String // Cloudinary public ID for file management
  },
  studentName: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  tutorName: {
    type: String,
    required: true
  },
  completionDate: {
    type: Date,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  isValid: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date // Optional expiration
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  metadata: {
    examTitle: String,
    totalQuestions: Number,
    timeSpent: Number,
    generatedBy: String,
    template: {
      type: String,
      default: 'default'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
certificateSchema.index({ userId: 1 });
certificateSchema.index({ courseId: 1 });
// certificateId and verificationCode already have unique indexes from field definitions

// Virtual for public verification URL
certificateSchema.virtual('verificationUrl').get(function() {
  return `${process.env.FRONTEND_URL}/verify-certificate/${this.verificationCode}`;
});

// Method to check if certificate is expired
certificateSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to increment download count
certificateSchema.methods.recordDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Static method to find by verification code
certificateSchema.statics.findByVerificationCode = function(code) {
  return this.findOne({ verificationCode: code, isValid: true });
};

// Static method to get user certificates
certificateSchema.statics.getUserCertificates = function(userId) {
  return this.find({ userId, isValid: true })
    .populate('courseId', 'title course_thumbnail')
    .sort({ createdAt: -1 });
};

export default mongoose.model('Certificate', certificateSchema);