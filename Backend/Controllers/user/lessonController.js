import User from '../../Model/usermodel.js';
import Lesson from '../../Model/LessonModel.js';
import { Course } from '../../Model/CourseModel.js';

// Mark lesson as completed
export const markLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    // Get lesson details
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Find user and course enrollment
    const user = await User.findById(userId);
    const enrollment = user.courses.find(c => c.course.toString() === lesson.course.toString());

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Check if lesson is already completed
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
      
      // Update progress based on completed lessons
      const course = await Course.findById(lesson.course).populate('lessons');
      const totalLessons = course.lessons.length;
      const completedCount = enrollment.completedLessons.length;
      
      enrollment.progress = Math.round((completedCount / totalLessons) * 100);
      enrollment.completionStatus = enrollment.progress >= 100;

      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Lesson marked as completed',
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking lesson as completed',
      error: error.message
    });
  }
};

// Get lesson progress for a course
export const getLessonProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const enrollment = user.courses.find(c => c.course.toString() === courseId);

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Get course with lessons
    const course = await Course.findById(courseId).populate('lessons');
    
    const lessonProgress = course.lessons.map(lesson => ({
      lessonId: lesson._id,
      title: lesson.title,
      completed: enrollment.completedLessons.includes(lesson._id)
    }));

    res.status(200).json({
      success: true,
      progress: enrollment.progress,
      completionStatus: enrollment.completionStatus,
      totalLessons: course.lessons.length,
      completedLessons: enrollment.completedLessons.length,
      lessons: lessonProgress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting lesson progress',
      error: error.message
    });
  }
};