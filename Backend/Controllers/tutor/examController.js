import Exam from '../../Model/ExamModel.js';
import ExamAttempt from '../../Model/ExamAttemptModel.js';
import { Course } from '../../Model/CourseModel.js';
import Lesson from '../../Model/LessonModel.js';
import { STATUS_CODES } from '../../constants/constants.js';

// Create exam for a course
export const createExam = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.tutor._id;
    const { title, description, questions, settings } = req.body;

    // Verify course belongs to tutor
    const course = await Course.findOne({ _id: courseId, tutor: tutorId });
    if (!course) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Course not found or unauthorized'
      });
    }

    // Check if exam already exists for this course
    const existingExam = await Exam.findOne({ courseId, tutorId });
    if (existingExam) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Exam already exists for this course'
      });
    }

    // Validate questions
    if (!questions || questions.length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'At least one question is required'
      });
    }

    // Create exam
    const exam = new Exam({
      courseId,
      tutorId,
      title,
      description,
      questions,
      settings: {
        passingScore: settings?.passingScore || 90,
        timeLimit: settings?.timeLimit || 60,
        maxAttempts: settings?.maxAttempts || 3,
        shuffleQuestions: settings?.shuffleQuestions !== false,
        shuffleOptions: settings?.shuffleOptions !== false
      }
    });

    await exam.save();

    // Enable exam in course settings
    await Course.findByIdAndUpdate(courseId, {
      'examSettings.isEnabled': true
    });

    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: 'Exam created successfully',
      exam
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error creating exam',
      error: error.message
    });
  }
};

// Get exam for a course
export const getExam = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.tutor._id;

    // Verify course belongs to tutor
    const course = await Course.findOne({ _id: courseId, tutor: tutorId });
    if (!course) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Course not found or unauthorized'
      });
    }

    const exam = await Exam.findOne({ courseId, tutorId });
    if (!exam) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      exam
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching exam',
      error: error.message
    });
  }
};

// Update exam
export const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const tutorId = req.tutor._id;
    const updates = req.body;

    const exam = await Exam.findOne({ _id: examId, tutorId });
    if (!exam) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Exam not found or unauthorized'
      });
    }

    // Update exam
    Object.keys(updates).forEach(key => {
      if (key === 'settings') {
        exam.settings = { ...exam.settings, ...updates.settings };
      } else {
        exam[key] = updates[key];
      }
    });

    await exam.save();

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Exam updated successfully',
      exam
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error updating exam',
      error: error.message
    });
  }
};

// Delete exam
export const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const tutorId = req.tutor._id;

    const exam = await Exam.findOne({ _id: examId, tutorId });
    if (!exam) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Exam not found or unauthorized'
      });
    }

    // Disable exam in course settings
    await Course.findByIdAndUpdate(exam.courseId, {
      'examSettings.isEnabled': false
    });

    await Exam.findByIdAndDelete(examId);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error deleting exam',
      error: error.message
    });
  }
};

// Get exam attempts for a course
export const getExamAttempts = async (req, res) => {
  try {
    const { examId } = req.params;
    const tutorId = req.tutor._id;
    const { page = 1, limit = 10 } = req.query;

    // Verify exam belongs to tutor
    const exam = await Exam.findOne({ _id: examId, tutorId });
    if (!exam) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Exam not found or unauthorized'
      });
    }

    const totalAttempts = await ExamAttempt.countDocuments({ examId });

    // Get attempts without population first
    const attemptsRaw = await ExamAttempt.find({ examId })
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Manually populate user data
    const User = (await import('../../Model/usermodel.js')).default;
    const attempts = await Promise.all(
      attemptsRaw.map(async (attempt) => {
        const user = await User.findById(attempt.userId).select('full_name email profileImage');
        return {
          ...attempt.toObject(),
          user: user // Use 'user' instead of 'userId' for frontend compatibility
        };
      })
    );

    // Calculate statistics
    const stats = await ExamAttempt.aggregate([
      { $match: { examId: exam._id } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$score' },
          passCount: { $sum: { $cond: ['$passed', 1, 0] } },
          totalAttempts: { $sum: 1 },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' }
        }
      }
    ]);

    res.status(STATUS_CODES.OK).json({
      success: true,
      attempts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalAttempts / limit),
        totalAttempts
      },
      statistics: stats[0] || {
        averageScore: 0,
        passCount: 0,
        totalAttempts: 0,
        highestScore: 0,
        lowestScore: 0
      }
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching exam attempts',
      error: error.message
    });
  }
};

// Set final lesson for course
export const setFinalLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId } = req.body;
    const tutorId = req.tutor._id;

    // Verify course belongs to tutor
    const course = await Course.findOne({ _id: courseId, tutor: tutorId });
    if (!course) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Course not found or unauthorized'
      });
    }

    // Verify lesson belongs to course
    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Lesson not found in this course'
      });
    }

    // Remove final lesson flag from all lessons in this course
    await Lesson.updateMany(
      { course: courseId },
      { isFinalLesson: false }
    );

    // Set the specified lesson as final
    await Lesson.findByIdAndUpdate(lessonId, { isFinalLesson: true });

    // Update course exam settings
    await Course.findByIdAndUpdate(courseId, {
      'examSettings.finalLessonId': lessonId
    });

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Final lesson set successfully'
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error setting final lesson',
      error: error.message
    });
  }
};

// Update exam settings for course
export const updateExamSettings = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { isEnabled, autoEnableAfterAllLessons } = req.body;
    const tutorId = req.tutor._id;

    // Verify course belongs to tutor
    const course = await Course.findOne({ _id: courseId, tutor: tutorId });
    if (!course) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Course not found or unauthorized'
      });
    }

    // Update exam settings
    const updateData = {};
    if (typeof isEnabled === 'boolean') {
      updateData['examSettings.isEnabled'] = isEnabled;
    }
    if (typeof autoEnableAfterAllLessons === 'boolean') {
      updateData['examSettings.autoEnableAfterAllLessons'] = autoEnableAfterAllLessons;
    }

    await Course.findByIdAndUpdate(courseId, updateData);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Exam settings updated successfully'
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error updating exam settings',
      error: error.message
    });
  }
};
