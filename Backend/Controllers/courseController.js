import mongoose from "mongoose";
import { Course } from "../Model/CourseModel.js";
import Category from "../Model/CategoryModel.js";
import Tutor from "../Model/TutorModel.js";



const addCourse = async (req,res)=>{
    try{
        const{
      title,
      category,
      description,
      price,
      offer_percentage,
      tutor,
      lessons,
      duration,
      quiz,
      course_thumbnail,
      level,
        } = req.body;


        if (
      !title ||
      !category ||
      !description ||
      !price ||
      !tutor ||
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

    const tutorExists = await Tutor.findById(tutor);
    if (!tutorExists) {
      return res.status(404).json({ message: "Tutor not found." });
    }

    // Note: Lesson validation can be added when Lesson model is implemented
    // if (lessons && lessons.length) {
    //   const validLessons = await Lesson.find({ _id: { $in: lessons } });
    //   if (validLessons.length !== lessons.length) {
    //     return res.status(400).json({ message: "Some lessons are invalid." });
    //   }
    // }
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
    console.error("Error in addCourse:", {
      message: error.message,
      stack: error.stack,
      data: req.body,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get all courses for a specific tutor
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
      level: course.level,
      duration: course.duration,
      enrolled_count: course.enrolled_count,
      average_rating: course.average_rating,
      total_reviews: course.total_reviews,
      isActive: course.isActive,
      listed: course.listed,
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
    console.error("Error fetching tutor courses:", error);
    res.status(500).json({ message: "Failed to fetch courses", error: error.message });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.tutor._id;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check if course belongs to the tutor
    const course = await Course.findOne({ _id: id, tutor: tutorId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }

    // If category is being updated, validate it
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
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Failed to update course" });
  }
};

// Toggle course listing (list/unlist)
const toggleCourseListing = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.tutor._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check if course belongs to the tutor
    const course = await Course.findOne({ _id: id, tutor: tutorId });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }

    // Toggle listing status
    course.listed = !course.listed;
    await course.save();

    const action = course.listed ? "listed" : "unlisted";
    res.status(200).json({
      message: `Course ${action} successfully`,
      course
    });
  } catch (error) {
    console.error("Error toggling course listing:", error);
    res.status(500).json({ message: "Failed to update course listing" });
  }
};

// Get single course details
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
    console.error("Error fetching course details:", error);
    res.status(500).json({ message: "Failed to fetch course details" });
  }
};

// Get all categories for course creation/editing
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
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export {
  addCourse,
  getTutorCourses,
  updateCourse,
  toggleCourseListing,
  getCourseDetails,
  getCategories
};