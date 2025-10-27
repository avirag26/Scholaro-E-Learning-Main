import mongoose from "mongoose";
import { Course } from "../Model/CourseModel.js";
import Category from "../Model/CategoryModel.js";
import Tutor from "../Model/TutorModel.js";
import Lesson from "../Model/LessonModel.js";
const addCourse = async (req,res)=>{
    try{
        const{
      title,
      category,
      description,
      price,
      offer_percentage,
      lessons,
      duration,
      quiz,
      course_thumbnail,
      level,
        } = req.body;
        const tutor = req.tutor._id;
        if (
      !title ||
      !category ||
      !description ||
      !price ||
      !course_thumbnail ||
      !level ||
      !duration
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }
    let categoryData;
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryData = await Category.findById(category);
    } else {
      categoryData = await Category.findOne({ title: category });
    }
    if (!categoryData) {
      return res.status(404).json({ message: "Category not found." });
    }
    if (lessons && lessons.length) {
      const validLessons = await Lesson.find({ _id: { $in: lessons } });
      if (validLessons.length !== lessons.length) {
        return res.status(400).json({ message: "Some lessons are invalid." });
      }
    }
     const newCourse = new Course({
      title,
      category: categoryData._id,
      description,
      price,
      offer_percentage: offer_percentage || 0,
      tutor,
      lessons,
      duration,
      quiz,
      course_thumbnail,
      level,
      listed: true,
    });
     await newCourse.save();
    await Category.findByIdAndUpdate(categoryData._id, {
      $addToSet: { courses: newCourse._id },
    });
    await Tutor.findByIdAndUpdate(tutor, {
      $addToSet: { courses: newCourse._id },
    });
    res.status(201).json({
      message: "Course added successfully.",
      course: newCourse,
    });
    } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
const getTutorCourses = async (req, res) => {
  try {
    const tutorId = req.tutor._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    let query = { tutor: tutorId };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status !== 'all') {
      if (status === 'listed') query.listed = true;
      if (status === 'unlisted') query.listed = false;
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;
    }
    const courses = await Course.find(query)
      .populate('category', 'title')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalCourses = await Course.countDocuments(query);
    const formattedCourses = courses.map((course) => ({
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage,
      category: course.category,
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count,
      average_rating: course.average_rating,
      total_reviews: course.total_reviews,
      isActive: course.isActive,
      listed: course.listed,
      unlistedByAdmin: course.unlistedByAdmin,
      isBanned: course.isBanned,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));
    res.status(200).json({
      courses: formattedCourses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit),
        totalItems: totalCourses,
        hasNext: page < Math.ceil(totalCourses / limit),
        hasPrev: page > 1
      },
      stats: {
        total: totalCourses,
        listed: await Course.countDocuments({ tutor: tutorId, listed: true }),
        unlisted: await Course.countDocuments({ tutor: tutorId, listed: false })
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses", error: error.message });
  }
};
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.tutor._id;
    const updateData = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }
    const course = await Course.findOne({ _id: id, tutor: tutorId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        return res.status(404).json({ message: "Category not found" });
      }
    }
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('category', 'title');
    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update course" });
  }
};
const toggleCourseListing = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.tutor._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }
    const course = await Course.findOne({ _id: id, tutor: tutorId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }

    // Check if course was unlisted by admin
    if (course.unlistedByAdmin && !course.listed) {
      return res.status(403).json({ 
        message: "This course has been unlisted by admin and cannot be listed by tutor",
        unlistedByAdmin: true
      });
    }

    course.listed = !course.listed;
    
    // If tutor is listing the course, ensure it's not marked as unlisted by admin
    if (course.listed) {
      course.unlistedByAdmin = false;
    }
    
    await course.save();
    const action = course.listed ? "listed" : "unlisted";
    res.status(200).json({
      message: `Course ${action} successfully`,
      course
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update course listing" });
  }
};
const getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.tutor._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }
    const course = await Course.findOne({ _id: id, tutor: tutorId })
      .populate('category', 'title description')
      .populate('tutor', 'full_name email profileImage');
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }
    res.status(200).json({ course });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch course details" });
  }
};
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isVisible: true })
      .select('title description')
      .sort({ title: 1 });
    const formattedCategories = categories.map(category => ({
      id: category._id,
      title: category.title,
      description: category.description
    }));
    res.status(200).json({ categories: formattedCategories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};
const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    await Category.findByIdAndUpdate(course.category, {
      $pull: { courses: courseId },
    });
    await Course.findByIdAndDelete(courseId);
    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting course",
      error: error.message,
    });
  }
};
const submitCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("lessons");
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    if (!course.lessons || course.lessons.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Course must have at least one lesson before submission",
      });
    }
    course.status = "completed";
    course.publishedAt = new Date();
    await course.save();
    res.status(200).json({
      success: true,
      message: "Course submitted successfully",
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit course",
      error: error.message,
    });
  }
};
const getCourseByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      minPrice,
      maxPrice,
      rating,
    } = req.query;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    let query = {
      category: categoryId,
      listed: true,
    };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }
    const sortOptions = {};
    sortOptions[sort] = order === "desc" ? -1 : 1;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const courses = await Course.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber)
      .populate("tutor", "full_name profile_image")
      .populate("category", "title");
    const totalCourses = await Course.countDocuments(query);
    res.status(200).json({
      success: true,
      courses,
      totalCourses,
      totalPages: Math.ceil(totalCourses / limitNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching courses by category",
      error: error.message,
    });
  }
};
export {
  addCourse,
  getTutorCourses,
  updateCourse,
  toggleCourseListing,
  getCourseDetails,
  getCategories,
  deleteCourse,
  submitCourse,
  getCourseByCategory,
};
