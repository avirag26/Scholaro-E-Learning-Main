import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  selectedOption: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  points: {
    type: Number,
    required: true
  }
});

const examAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'courses',
    required: true
  },
  answers: [answerSchema],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    required: true
  },
  earnedPoints: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number,
    required: true // in seconds
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
examAttemptSchema.index({ userId: 1, examId: 1 });
examAttemptSchema.index({ courseId: 1 });
examAttemptSchema.index({ examId: 1 });

// Static method to get user's best attempt
examAttemptSchema.statics.getBestAttempt = function (userId, examId) {
  return this.findOne({ userId, examId })
    .sort({ score: -1, completedAt: -1 })
    .exec();
};

// Static method to get attempt count for user
examAttemptSchema.statics.getAttemptCount = function (userId, examId) {
  return this.countDocuments({ userId, examId });
};

// Static method to check if user can attempt exam
examAttemptSchema.statics.canUserAttempt = async function (userId, examId, maxAttempts) {
  const attemptCount = await this.getAttemptCount(userId, examId);
  return attemptCount < maxAttempts;
};

// Method to calculate score
examAttemptSchema.methods.calculateScore = function () {
  if (this.totalPoints === 0) return 0;
  return Math.round((this.earnedPoints / this.totalPoints) * 100);
};

export default mongoose.model('ExamAttempt', examAttemptSchema);