import mongoose from "mongoose";
import Lesson from "../Model/LessonModel.js";
import { Course } from "../Model/CourseModel.js";

// Create a new lesson
const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, duration, videoUrl, thumbnailUrl, pdfUrl } = req.body;
    const tutorId = req.tutor._id;



    // Validate required fields
    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    if (!req.tutor || !req.tutor._id) {
      return res.status(401).json({ message: "Tutor authentication required" });
    }

    // Validate course exists and belongs to tutor
    const course = await Course.findOne({ _id: courseId, tutor: tutorId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }

    // Get the next order number
    const lastLesson = await Lesson.findOne({ course: courseId }).sort({ order: -1 });
    const order = lastLesson ? lastLesson.order + 1 : 1;

    // Create lesson
    const lesson = new Lesson({
      title,
      description,
      duration,
      course: courseId,
      tutor: tutorId,
      videoUrl,
      thumbnailUrl,
      pdfUrl,
      order
    });

    await lesson.save();

    // Update course with lesson reference
    await Course.findByIdAndUpdate(courseId, {
      $push: { lessons: lesson._id }
    });

    res.status(201).json({
      message: "Lesson created successfully",
      lesson
    });
  } catch (error) {
    console.error("Error creating lesson:", error);
    res.status(500).json({ message: "Failed to create lesson" });
  }
};

// Get all lessons for a course
const getCourseLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.tutor._id;

    // Validate course belongs to tutor
    const course = await Course.findOne({ _id: courseId, tutor: tutorId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }

    const lessons = await Lesson.find({ course: courseId })
      .sort({ order: 1 })
      .populate('tutor', 'full_name');

    const formattedLessons = lessons.map(lesson => ({
      id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      videoUrl: lesson.videoUrl,
      thumbnailUrl: lesson.thumbnailUrl,
      pdfUrl: lesson.pdfUrl,
      order: lesson.order,
      isPublished: lesson.isPublished,
      views: lesson.views,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    }));

    res.status(200).json({
      lessons: formattedLessons,
      course: {
        id: course._id,
        title: course.title
      }
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
};

// Update lesson
const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const tutorId = req.tutor._id;
    const updateData = req.body;

    // Check if lesson belongs to tutor
    const lesson = await Lesson.findOne({ _id: lessonId, tutor: tutorId });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found or unauthorized" });
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: "Lesson updated successfully",
      lesson: updatedLesson
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    res.status(500).json({ message: "Failed to update lesson" });
  }
};

// Delete lesson
const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const tutorId = req.tutor._id;

    // Check if lesson belongs to tutor
    const lesson = await Lesson.findOne({ _id: lessonId, tutor: tutorId });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found or unauthorized" });
    }

    // Remove lesson from course
    await Course.findByIdAndUpdate(lesson.course, {
      $pull: { lessons: lessonId }
    });

    // Delete lesson
    await Lesson.findByIdAndDelete(lessonId);

    res.status(200).json({
      message: "Lesson deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    res.status(500).json({ message: "Failed to delete lesson" });
  }
};

// Toggle lesson publish status
const toggleLessonPublish = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const tutorId = req.tutor._id;

    // Check if lesson belongs to tutor
    const lesson = await Lesson.findOne({ _id: lessonId, tutor: tutorId });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found or unauthorized" });
    }

    lesson.isPublished = !lesson.isPublished;
    await lesson.save();

    const status = lesson.isPublished ? "published" : "unpublished";
    res.status(200).json({
      message: `Lesson ${status} successfully`,
      lesson
    });
  } catch (error) {
    console.error("Error toggling lesson publish status:", error);
    res.status(500).json({ message: "Failed to update lesson status" });
  }
};

// Get single lesson details
const getLessonDetails = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const tutorId = req.tutor._id;

    const lesson = await Lesson.findOne({ _id: lessonId, tutor: tutorId })
      .populate('course', 'title')
      .populate('tutor', 'full_name');

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found or unauthorized" });
    }

    res.status(200).json({ lesson });
  } catch (error) {
    console.error("Error fetching lesson details:", error);
    res.status(500).json({ message: "Failed to fetch lesson details" });
  }
};

export {
  createLesson,
  getCourseLessons,
  updateLesson,
  deleteLesson,
  toggleLessonPublish,
  getLessonDetails
};