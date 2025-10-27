import mongoose from 'mongoose';
const LessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: false
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'courses',
      required: true
    },
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true
    },
    videoUrl: {
      type: String,
      required: false
    },
    thumbnailUrl: {
      type: String,
      required: false
    },
    pdfUrl: {
      type: String,
      required: false
    },
    order: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);
LessonSchema.index({ course: 1, order: 1 });
LessonSchema.index({ tutor: 1 });
LessonSchema.index({ isPublished: 1 });
const Lesson = mongoose.model('lessons', LessonSchema);
export default Lesson;
