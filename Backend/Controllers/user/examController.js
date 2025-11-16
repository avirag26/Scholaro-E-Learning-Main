import Exam from '../../Model/ExamModel.js';
import ExamAttempt from '../../Model/ExamAttemptModel.js';
import Certificate from '../../Model/CertificateModel.js';
import { Course } from '../../Model/CourseModel.js';
import Lesson from '../../Model/LessonModel.js';
import User from '../../Model/usermodel.js';

// Check exam eligibility
export const checkExamEligibility = async (req, res) => {
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

    const course = await Course.findById(courseId).populate('lessons');
    if (!course || !course.examSettings.isEnabled) {
      return res.status(404).json({
        success: false,
        message: 'Exam not available for this course'
      });
    }

    let isEligible = false;
    let message = '';

    if (course.examSettings.finalLessonId) {
      const finalLesson = await Lesson.findById(course.examSettings.finalLessonId);
      if (finalLesson) {
        const finalLessonCompleted = enrollment.completedLessons && 
          enrollment.completedLessons.includes(course.examSettings.finalLessonId);
        
        isEligible = finalLessonCompleted;
        message = isEligible 
          ? 'You can take the exam' 
          : `Complete the final lesson "${finalLesson.title}" to unlock the exam`;
      }
    } else if (course.examSettings.autoEnableAfterAllLessons) {
      const totalLessons = course.lessons.length;
      const completedLessons = enrollment.completedLessons ? enrollment.completedLessons.length : 0;
      
      isEligible = completedLessons >= totalLessons && totalLessons > 0;
      message = isEligible 
        ? 'You can take the exam' 
        : `Complete all lessons to unlock the exam (${completedLessons}/${totalLessons} completed)`;
    } else {
      isEligible = enrollment.completionStatus || enrollment.progress >= 100;
      message = isEligible 
        ? 'You can take the exam' 
        : 'Complete the course to unlock the exam';
    }
    
    if (enrollment.progress >= 100 || enrollment.completionStatus) {
      isEligible = true;
      message = 'You can take the exam';
    }

    const exam = await Exam.findOne({ courseId });
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found for this course'
      });
    }

    // Check attempt count
    const attemptCount = await ExamAttempt.getAttemptCount(userId, exam._id);
    const canAttempt = attemptCount < exam.settings.maxAttempts;

    // Check if user already has a passing attempt
    const bestAttempt = await ExamAttempt.getBestAttempt(userId, exam._id);
    const hasPassed = bestAttempt && bestAttempt.passed;

    // If maximum attempts reached, return success but with attempts exhausted status
    if (!canAttempt) {
      return res.status(200).json({
        success: true,
        eligible: false,
        attemptsExhausted: true,
        message: hasPassed 
          ? `Congratulations! You have already passed this exam with ${bestAttempt.score}%`
          : `All attempts completed (${exam.settings.maxAttempts}/${exam.settings.maxAttempts}). You can review your previous attempts.`,
        examInfo: {
          title: exam.title,
          description: exam.description,
          timeLimit: exam.settings.timeLimit,
          passingScore: exam.settings.passingScore,
          maxAttempts: exam.settings.maxAttempts,
          attemptsUsed: attemptCount,
          attemptsRemaining: 0,
          hasPassed,
          bestScore: bestAttempt?.score || 0,
          allAttempts: await ExamAttempt.find({ userId, examId: exam._id })
            .select('score passed completedAt timeSpent')
            .sort({ completedAt: -1 })
        }
      });
    }

    res.status(200).json({
      success: true,
      eligible: isEligible,
      message,
      examInfo: {
        title: exam.title,
        description: exam.description,
        timeLimit: exam.settings.timeLimit,
        passingScore: exam.settings.passingScore,
        maxAttempts: exam.settings.maxAttempts,
        attemptsUsed: attemptCount,
        attemptsRemaining: exam.settings.maxAttempts - attemptCount,
        hasPassed,
        bestScore: bestAttempt?.score || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking exam eligibility',
      error: error.message
    });
  }
};

// Get exam for student (if eligible)
export const getExamForStudent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Check if user is enrolled in course
    const user = await User.findById(userId);
    const enrollment = user.courses.find(c => c.course.toString() === courseId);
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Get course with exam settings
    const course = await Course.findById(courseId);
    if (!course || !course.examSettings.isEnabled) {
      return res.status(404).json({
        success: false,
        message: 'Exam not available for this course'
      });
    }

    // Check if user is eligible (simplified check)
    const isEligible = enrollment.completionStatus || enrollment.progress >= 100;
    if (!isEligible) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible to take this exam yet'
      });
    }

    const exam = await Exam.findOne({ courseId });
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Remove correct answer info from response (students shouldn't see this)
    const studentExam = {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      questions: exam.questions.map((q, index) => ({
        question: q.question,
        options: q.options,
        points: q.points
      })),
      settings: {
        timeLimit: exam.settings.timeLimit,
        passingScore: exam.settings.passingScore
      },
      totalPoints: exam.totalPoints
    };

    res.status(200).json({
      success: true,
      exam: studentExam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exam',
      error: error.message
    });
  }
};

// Start exam attempt
export const startExamAttempt = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check attempt limits
    const attemptCount = await ExamAttempt.countDocuments({ userId, examId });
    if (attemptCount >= exam.settings.maxAttempts) {
      return res.status(403).json({
        success: false,
        message: 'Maximum attempts reached'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exam attempt started',
      sessionId: `${userId}_${examId}_${Date.now()}`,
      startedAt: new Date(),
      timeLimit: exam.settings.timeLimit,
      totalQuestions: exam.questions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting exam attempt',
      error: error.message
    });
  }
};

export const submitExamAttempt = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers, startedAt, timeSpent } = req.body;
    const userId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Validate time spent
    const maxTimeAllowed = exam.settings.timeLimit * 60; // in seconds
    if (timeSpent > maxTimeAllowed + 30) { // 30 seconds grace period
      return res.status(400).json({
        success: false,
        message: 'Time limit exceeded'
      });
    }

    // Calculate score
    let earnedPoints = 0;
    const processedAnswers = [];

    answers.forEach((answer, index) => {
      const question = exam.questions[answer.questionIndex];
      if (question) {
        const isCorrect = answer.selectedOption === question.correctAnswer;
        const points = isCorrect ? question.points : 0;
        
        earnedPoints += points;
        processedAnswers.push({
          questionIndex: answer.questionIndex,
          selectedOption: answer.selectedOption,
          isCorrect,
          points
        });
      }
    });

    const totalPoints = exam.totalPoints;
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= exam.settings.passingScore;

    // Create exam attempt record
    const examAttempt = new ExamAttempt({
      userId,
      examId,
      courseId: exam.courseId,
      answers: processedAnswers,
      score,
      totalPoints,
      earnedPoints,
      passed,
      timeSpent,
      startedAt: new Date(startedAt),
      completedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await examAttempt.save();

    // If passed, update course completion status
    if (passed) {
      await User.updateOne(
        { _id: userId, 'courses.course': exam.courseId },
        { 
          $set: { 
            'courses.$.completionStatus': true,
            'courses.$.progress': 100
          }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: passed ? 'Congratulations! You passed the exam!' : 'Exam completed. You can retake if attempts remain.',
      result: {
        attemptId: examAttempt._id,
        score,
        passed,
        earnedPoints,
        totalPoints,
        passingScore: exam.settings.passingScore,
        timeSpent,
        canRetake: !passed && await ExamAttempt.canUserAttempt(userId, examId, exam.settings.maxAttempts)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting exam attempt',
      error: error.message
    });
  }
};

// Get exam attempt result
export const getExamAttemptResult = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user._id;

    const attempt = await ExamAttempt.findOne({ _id: attemptId, userId })
      .populate('examId', 'title settings questions')
      .populate('courseId', 'title');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found'
      });
    }

    // Prepare detailed results
    const detailedResults = attempt.answers.map(answer => {
      const question = attempt.examId.questions[answer.questionIndex];
      return {
        question: question.question,
        options: question.options,
        selectedOption: answer.selectedOption,
        correctAnswer: question.correctAnswer,
        isCorrect: answer.isCorrect,
        points: answer.points,
        explanation: question.explanation
      };
    });

    res.status(200).json({
      success: true,
      attempt: {
        _id: attempt._id,
        score: attempt.score,
        passed: attempt.passed,
        earnedPoints: attempt.earnedPoints,
        totalPoints: attempt.totalPoints,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.completedAt,
        exam: {
          title: attempt.examId.title,
          passingScore: attempt.examId.settings.passingScore
        },
        course: {
          title: attempt.courseId.title
        },
        detailedResults
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exam result',
      error: error.message
    });
  }
};