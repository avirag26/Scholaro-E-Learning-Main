import mongoose from "mongoose";
import Lesson from "../Model/LessonModel.js";
import { Course } from "../Model/CourseModel.js";
const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, duration, videoUrl, thumbnailUrl, pdfUrl } = req.body;
    const tutorId = req.tutor._id;
    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Validate lesson title
    if (title.length < 3 || title.length > 100) {
      return res.status(400).json({ message: "Lesson title must be between 3 and 100 characters" });
    }
    if (title.includes('_')) {
      return res.status(400).json({ message: "Lesson title cannot contain underscores" });
    }
    if (!/^[a-zA-Z0-9\s\-\.\,\:\(\)]+$/.test(title)) {
      return res.status(400).json({ message: "Lesson title can only contain letters, numbers, spaces, and basic punctuation (- . , : ( ))" });
    }
    if (!title.trim()) {
      return res.status(400).json({ message: "Lesson title cannot be empty or just spaces" });
    }

    // Validate description
    if (description.length < 10 || description.length > 500) {
      return res.status(400).json({ message: "Description must be between 10 and 500 characters" });
    }
    if (!/^[a-zA-Z0-9\s\-\.\,\:\(\)\!\?\'\"\n\r]+$/.test(description)) {
      return res.status(400).json({ message: "Description contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed." });
    }
    if (description.trim().length < 10) {
      return res.status(400).json({ message: "Description must have at least 10 meaningful characters" });
    }
    if (!req.tutor || !req.tutor._id) {
      return res.status(401).json({ message: "Tutor authentication required" });
    }
    const course = await Course.findOne({ _id: courseId, tutor: tutorId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }
    const lastLesson = await Lesson.findOne({ course: courseId }).sort({ order: -1 });
    const order = lastLesson ? lastLesson.order + 1 : 1;
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
    await Course.findByIdAndUpdate(courseId, {
      $push: { lessons: lesson._id }
    });
    res.status(201).json({
      message: "Lesson created successfully",
      lesson
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create lesson" });
  }
};
const getCourseLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const tutorId = req.tutor._id;
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
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
};
const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const tutorId = req.tutor._id;
    const updateData = req.body;
    
    // Validate title if provided
    if (updateData.title) {
      if (updateData.title.length < 3 || updateData.title.length > 100) {
        return res.status(400).json({ message: "Lesson title must be between 3 and 100 characters" });
      }
      if (updateData.title.includes('_')) {
        return res.status(400).json({ message: "Lesson title cannot contain underscores" });
      }
      if (!/^[a-zA-Z0-9\s\-\.\,\:\(\)]+$/.test(updateData.title)) {
        return res.status(400).json({ message: "Lesson title can only contain letters, numbers, spaces, and basic punctuation (- . , : ( ))" });
      }
      if (!updateData.title.trim()) {
        return res.status(400).json({ message: "Lesson title cannot be empty or just spaces" });
      }
    }

    // Validate description if provided
    if (updateData.description) {
      if (updateData.description.length < 10 || updateData.description.length > 500) {
        return res.status(400).json({ message: "Description must be between 10 and 500 characters" });
      }
      if (!/^[a-zA-Z0-9\s\-\.\,\:\(\)\!\?\'\"\n\r]+$/.test(updateData.description)) {
        return res.status(400).json({ message: "Description contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed." });
      }
      if (updateData.description.trim().length < 10) {
        return res.status(400).json({ message: "Description must have at least 10 meaningful characters" });
      }
    }
    
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
    res.status(500).json({ message: "Failed to update lesson" });
  }
};
const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const tutorId = req.tutor._id;
    const lesson = await Lesson.findOne({ _id: lessonId, tutor: tutorId });
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found or unauthorized" });
    }
    await Course.findByIdAndUpdate(lesson.course, {
      $pull: { lessons: lessonId }
    });
    await Lesson.findByIdAndDelete(lessonId);
    res.status(200).json({
      message: "Lesson deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete lesson" });
  }
};
const toggleLessonPublish = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const tutorId = req.tutor._id;
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
    res.status(500).json({ message: "Failed to update lesson status" });
  }
};
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
