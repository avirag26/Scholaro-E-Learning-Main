import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  explanation: {
    type: String,
    trim: true
  }
});

const examSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'courses',
    required: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'tutors',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questions: [questionSchema],
  settings: {
    passingScore: {
      type: Number,
      default: 90,
      min: 0,
      max: 100
    },
    timeLimit: {
      type: Number,
      default: 60,
      min: 5
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1
    },
    shuffleQuestions: {
      type: Boolean,
      default: true
    },
    shuffleOptions: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
examSchema.index({ courseId: 1 });
examSchema.index({ tutorId: 1 });

// Virtual for total points
examSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Method to shuffle questions
examSchema.methods.getShuffledQuestions = function() {
  if (!this.settings.shuffleQuestions) return this.questions;
  
  return [...this.questions].sort(() => Math.random() - 0.5);
};

// Method to shuffle options for a question
examSchema.methods.getShuffledOptions = function(question) {
  if (!this.settings.shuffleOptions) return question.options;
  
  const options = [...question.options];
  const correctAnswer = options[question.correctAnswer];
  
  // Shuffle options
  const shuffled = options.sort(() => Math.random() - 0.5);
  
  // Find new index of correct answer
  const newCorrectIndex = shuffled.indexOf(correctAnswer);
  
  return {
    options: shuffled,
    correctAnswer: newCorrectIndex
  };
};

export default mongoose.model('Exam', examSchema);