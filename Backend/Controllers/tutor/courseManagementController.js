import mongoose from "mongoose";
import { Course } from "../../Model/CourseModel.js";
import Category from "../../Model/CategoryModel.js";
import Tutor from "../../Model/TutorModel.js";
import Lesson from "../../Model/LessonModel.js";
import Cart from "../../Model/CartModel.js";
import Wishlist from "../../Model/WishlistModel.js";
import { STATUS_CODES } from "../../constants/constants.js";

const addCourse = async (req, res) => {
  try {
    const {
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

    // Validate course title
    if (title.length < 3 || title.length > 100) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Course title must be between 3 and 100 characters" });
    }
    if (title.includes('_')) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Course title cannot contain underscores" });
    }
    if (!/^[a-zA-Z0-9\s\-\.\,\:\(\)]+$/.test(title)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Course title can only contain letters, numbers, spaces, and basic punctuation (- . , : ( ))" });
    }
    if (!title.trim()) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Course title cannot be empty or just spaces" });
    }

    // Validate description
    if (description.length < 10 || description.length > 1000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Description must be between 10 and 1000 characters" });
    }
    if (!/^[a-zA-Z0-9\s\-\.\,\:\(\)\!\?\'\"\n\r]+$/.test(description)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Description contains invalid characters. Only letters, numbers, spaces, and basic punctuation are allowed." });
    }
    if (description.trim().length < 10) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Description must have at least 10 meaningful characters" });
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Price must be a valid number greater than 0" });
    }
    if (priceNum > 100000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Price cannot exceed ₹100,000" });
    }

    // Validate offer percentage
    if (offer_percentage) {
      const offerNum = parseFloat(offer_percentage);
      if (isNaN(offerNum) || offerNum < 0 || offerNum > 90) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Offer percentage must be between 0 and 90" });
      }
    }
    let categoryData;
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryData = await Category.findById(category);
    } else {
      categoryData = await Category.findOne({ title: category });
    }
    if (!categoryData) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Category not found." });
    }
    if (lessons && lessons.length) {
      const validLessons = await Lesson.find({ _id: { $in: lessons } });
      if (validLessons.length !== lessons.length) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Some lessons are invalid." });
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
    res.status(STATUS_CODES.CREATED).json({
      message: "Course added successfully.",
      course: newCourse,
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error", error: error.message });
  }
};

const getTutorCourses = async (req, res) => {
  try {
    const tutorId = req.tutor._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    
    let matchQuery = { tutor: tutorId };
    if (search) {
      matchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status !== 'all') {
      if (status === 'listed') matchQuery.listed = true;
      if (status === 'unlisted') matchQuery.listed = false;
      if (status === 'active') matchQuery.isActive = true;
      if (status === 'inactive') matchQuery.isActive = false;
    }

    // Use aggregation to get correct enrolled count
    const courses = await Course.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$courseId', '$courses.course']
                }
              }
            }
          ],
          as: 'enrolledUsers'
        }
      },
      {
        $addFields: {
          enrolled_count: { $size: '$enrolledUsers' },
          category: { $arrayElemAt: ['$categoryInfo', 0] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          offer_percentage: 1,
          category: {
            _id: '$category._id',
            title: '$category.title'
          },
          course_thumbnail: 1,
          enrolled_count: 1,
          average_rating: 1,
          total_reviews: 1,
          isActive: 1,
          listed: 1,
          unlistedByAdmin: 1,
          isBanned: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    const [totalCourses, listedCount, unlistedCount] = await Promise.all([
      Course.countDocuments(matchQuery),
      Course.countDocuments({ tutor: tutorId, listed: true }),
      Course.countDocuments({ tutor: tutorId, listed: false })
    ]);
    
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
    
    res.status(STATUS_CODES.OK).json({
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
        listed: listedCount,
        unlisted: unlistedCount
      }
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch courses", error: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.tutor._id;
    const updateData = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid course ID" });
    }
    const course = await Course.findOne({ _id: id, tutor: tutorId });
    if (!course) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Course not found or unauthorized" });
    }
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Category not found" });
      }
    }
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('category', 'title');
    res.status(STATUS_CODES.OK).json({
      message: "Course updated successfully",
      course: updatedCourse
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to update course" });
  }
};

const toggleCourseListing = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.tutor._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid course ID" });
    }
    const course = await Course.findOne({ _id: id, tutor: tutorId });
    if (!course) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Course not found or unauthorized" });
    }

    // Check if course was unlisted by admin
    if (course.unlistedByAdmin && !course.listed) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
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

    // If course is being unlisted, remove it from all carts and wishlists
    if (!course.listed) {
      try {
        // Remove from all carts and wishlists in parallel
        await Promise.all([
          Cart.updateMany(
            { 'items.course': id },
            { $pull: { items: { course: id } } }
          ),
          Wishlist.updateMany(
            { 'items.course': id },
            { $pull: { items: { course: id } } }
          )
        ]);

        // Recalculate cart totals for affected carts
        const affectedCarts = await Cart.find({ 'items.0': { $exists: true } })
          .populate('items.course');

        for (const cart of affectedCarts) {
          const availableItems = cart.items.filter(item => {
            const course = item.course;
            return course && course.listed && course.isActive && !course.isBanned;
          });

          const totalAmount = availableItems.reduce((total, item) => {
            const course = item.course;
            const discountedPrice = course.price - (course.price * (course.offer_percentage || 0) / 100);
            return total + discountedPrice;
          }, 0);

          cart.totalAmount = totalAmount;
          cart.totalItems = availableItems.length;
          await cart.save();
        }
      } catch (cleanupError) {
        // Don't fail the main operation if cleanup fails
      }
    }

    const action = course.listed ? "listed" : "unlisted";
    res.status(STATUS_CODES.OK).json({
      message: `Course ${action} successfully`,
      course
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to update course listing" });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.tutor._id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid course ID" });
    }

    // Use aggregation to get course with correct enrolled count
    const courseResult = await Course.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          tutor: tutorId
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'tutors',
          localField: 'tutor',
          foreignField: '_id',
          as: 'tutorInfo'
        }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'course',
          as: 'lessonsInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$courseId', '$courses.course']
                }
              }
            }
          ],
          as: 'enrolledUsers'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryInfo', 0] },
          tutor: { $arrayElemAt: ['$tutorInfo', 0] },
          lessons: '$lessonsInfo',
          enrolled_count: { $size: '$enrolledUsers' }
        }
      }
    ]);

    if (!courseResult || courseResult.length === 0) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Course not found or unauthorized" });
    }

    const course = courseResult[0];
    res.status(STATUS_CODES.OK).json({ course });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch course details" });
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
    res.status(STATUS_CODES.OK).json({ categories: formattedCategories });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch categories" });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }
    await Category.findByIdAndUpdate(course.category, {
      $pull: { courses: courseId },
    });
    await Course.findByIdAndDelete(courseId);
    res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
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
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }
    if (!course.lessons || course.lessons.length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Course must have at least one lesson before submission",
      });
    }
    course.status = "completed";
    course.publishedAt = new Date();
    await course.save();
    res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Course submitted successfully",
      data: course,
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
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
      return res.status(STATUS_CODES.NOT_FOUND).json({
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
    res.status(STATUS_CODES.OK).json({
      success: true,
      courses,
      totalCourses,
      totalPages: Math.ceil(totalCourses / limitNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
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
