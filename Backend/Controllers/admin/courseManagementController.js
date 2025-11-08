import { Course } from "../../Model/CourseModel.js";
import Category from "../../Model/CategoryModel.js";
import Cart from "../../Model/CartModel.js";
import Wishlist from "../../Model/WishlistModel.js";
import Lesson from "../../Model/LessonModel.js";
import mongoose from "mongoose";

const getCoursesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const rating = req.query.rating || 'all';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    let matchStage = {
      category: new mongoose.Types.ObjectId(categoryId)
    };

    // Apply status filter
    if (status === 'listed') {
      matchStage.listed = true;
    } else if (status === 'unlisted') {
      matchStage.listed = false;
    } else if (status === 'active') {
      matchStage.isActive = true;
      matchStage.isBanned = false;
    } else {
      // For 'all', show all courses but exclude banned ones
      matchStage.isBanned = false;
    }

    // Apply rating filter
    if (rating !== 'all') {
      const minRating = parseInt(rating.replace('+', ''));
      matchStage.average_rating = { $gte: minRating };
    }

    // Apply price filter
    if (minPrice !== null || maxPrice !== null) {
      const priceFilter = {};
      if (minPrice !== null) priceFilter.$gte = minPrice;
      if (maxPrice !== null) priceFilter.$lte = maxPrice;
      matchStage.price = priceFilter;
    }

    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'tutors',
          localField: 'tutor',
          foreignField: '_id',
          as: 'tutorInfo'
        }
      },
      {
        $match: {
          'tutorInfo.is_blocked': { $ne: true }
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          offer_percentage: 1,
          course_thumbnail: 1,
          average_rating: 1,
          total_reviews: 1,
          enrolled_count: 1,
          createdAt: 1,
          tutor: {
            $arrayElemAt: ['$tutorInfo', 0]
          }
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          offer_percentage: 1,
          course_thumbnail: 1,
          average_rating: 1,
          total_reviews: 1,
          enrolled_count: 1,
          createdAt: 1,
          'tutor.full_name': 1,
          'tutor.profileImage': 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const courses = await Course.aggregate(pipeline);

    const totalPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'tutors',
          localField: 'tutor',
          foreignField: '_id',
          as: 'tutorInfo'
        }
      },
      {
        $match: {
          'tutorInfo.is_blocked': { $ne: true }
        }
      },
      { $count: 'total' }
    ];

    const totalResult = await Course.aggregate(totalPipeline);
    const totalCourses = totalResult.length > 0 ? totalResult[0].total : 0;

    const formattedCourses = courses.map((course) => ({
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage,
      course_thumbnail: course.course_thumbnail,
      average_rating: course.average_rating || 0,
      total_reviews: course.total_reviews || 0,
      enrolled_count: course.enrolled_count || 0,
      tutor: {
        full_name: course.tutor?.full_name || 'Unknown',
        profileImage: course.tutor?.profileImage
      },
      createdAt: course.createdAt
    }));

    res.status(200).json({
      success: true,
      category: {
        id: category._id,
        title: category.title,
        description: category.description
      },
      courses: formattedCourses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit),
        totalItems: totalCourses,
        hasNext: page < Math.ceil(totalCourses / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses"
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';

    // Build base query
    let courseQuery = {};

    // Apply status filter
    if (status === 'listed') {
      courseQuery.listed = true;
    } else if (status === 'unlisted') {
      courseQuery.listed = false;
    } else if (status === 'active') {
      courseQuery.isActive = true;
      courseQuery.isBanned = false;
    }

    // Apply search filter if provided
    if (search) {
      courseQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const totalCourses = await Course.countDocuments(courseQuery);

    // Get paginated courses
    const courses = await Course.find(courseQuery)
      .populate('tutor', 'full_name profileImage')
      .populate('category', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedCourses = courses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage,
      course_thumbnail: course.course_thumbnail,
      average_rating: course.average_rating || 0,
      total_reviews: course.total_reviews || 0,
      enrolled_count: course.enrolled_count || 0,
      listed: course.listed,
      isActive: course.isActive,
      isBanned: course.isBanned,
      category: {
        id: course.category?._id,
        title: course.category?.title || 'Uncategorized'
      },
      tutor: {
        full_name: course.tutor?.full_name || 'Unknown',
        profileImage: course.tutor?.profileImage
      },
      createdAt: course.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formattedCourses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit),
        totalItems: totalCourses,
        hasNext: page < Math.ceil(totalCourses / limit),
        hasPrev: page > 1,
        limit: limit
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
      error: error.message
    });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }

    // Use aggregation to get course with correct enrolled count
    const courseResult = await Course.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(courseId)
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
      },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          offer_percentage: 1,
          course_thumbnail: 1,
          enrolled_count: 1,
          average_rating: 1,
          total_reviews: 1,
          duration: 1,
          level: 1,
          listed: 1,
          isActive: 1,
          isBanned: 1,
          unlistedByAdmin: 1,
          createdAt: 1,
          updatedAt: 1,
          category: {
            _id: '$category._id',
            title: '$category.title',
            description: '$category.description'
          },
          tutor: {
            _id: '$tutor._id',
            full_name: '$tutor.full_name',
            email: '$tutor.email',
            profileImage: '$tutor.profileImage',
            bio: '$tutor.bio'
          },
          lessons: {
            $map: {
              input: '$lessons',
              as: 'lesson',
              in: {
                _id: '$$lesson._id',
                title: '$$lesson.title',
                description: '$$lesson.description',
                duration: '$$lesson.duration',
                order: '$$lesson.order',
                isPublished: '$$lesson.isPublished'
              }
            }
          }
        }
      }
    ]);

    if (!courseResult || courseResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const course = courseResult[0];

    const formattedCourse = {
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage,
      category: course.category,
      tutor: course.tutor,
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count,
      average_rating: course.average_rating || 0,
      total_reviews: course.total_reviews || 0,
      lessons: course.lessons,
      duration: course.duration,
      level: course.level,
      listed: course.listed,
      isActive: course.isActive,
      isBanned: course.isBanned,
      unlistedByAdmin: course.unlistedByAdmin,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };

    res.status(200).json({
      success: true,
      course: formattedCourse
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch course details",
      error: error.message
    });
  }
};

const toggleCourseListing = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Toggle listing status
    course.listed = !course.listed;

    // If admin is unlisting the course, mark it as unlisted by admin
    if (!course.listed) {
      course.unlistedByAdmin = true;
    } else {
      course.unlistedByAdmin = false;
    }

    await course.save();

    // If course is being unlisted, remove it from all carts and wishlists
    if (!course.listed) {
      try {
        // Remove from all carts
        await Cart.updateMany(
          { 'items.course': courseId },
          { $pull: { items: { course: courseId } } }
        );

        // Remove from all wishlists
        await Wishlist.updateMany(
          { 'items.course': courseId },
          { $pull: { items: { course: courseId } } }
        );

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
    res.status(200).json({
      success: true,
      message: `Course ${action} successfully`,
      course: {
        id: course._id,
        listed: course.listed,
        unlistedByAdmin: course.unlistedByAdmin
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update course listing",
      error: error.message
    });
  }
};

const refreshEnrollmentCounts = async (req, res) => {
  try {
    const User = (await import('../../Model/usermodel.js')).default;

    const courses = await Course.find();
    let updatedCount = 0;

    for (const course of courses) {
      const actualCount = await User.countDocuments({
        'courses.course': course._id
      });

      await Course.findByIdAndUpdate(course._id, {
        enrolled_count: actualCount
      });

      updatedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully refreshed enrollment counts for ${updatedCount} courses`,
      updatedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to refresh enrollment counts",
      error: error.message
    });
  }
};

const getLessonDetails = async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID"
      });
    }

    const lesson = await Lesson.findById(lessonId)
      .populate('course', 'title description tutor')
      .populate({
        path: 'course',
        populate: {
          path: 'tutor',
          select: 'full_name email'
        }
      });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found"
      });
    }

    const formattedLesson = {
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      thumbnailUrl: lesson.thumbnailUrl,
      pdfUrl: lesson.pdfUrl,
      duration: lesson.duration,
      order: lesson.order,
      isPublished: lesson.isPublished,
      isFinalLesson: lesson.isFinalLesson,
      isRequired: lesson.isRequired,
      views: lesson.views,
      course: lesson.course,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    };

    res.status(200).json({
      success: true,
      lesson: formattedLesson
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch lesson details",
      error: error.message
    });
  }
};

const adminToggleLessonPublish = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found"
      });
    }

    lesson.isPublished = !lesson.isPublished;
    await lesson.save();

    res.status(200).json({
      success: true,
      message: `Lesson ${lesson.isPublished ? 'published' : 'unpublished'} successfully`,
      isPublished: lesson.isPublished
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to toggle lesson status"
    });
  }
};

const getAllCoursesGrouped = async (req, res) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const categoryFilter = req.query.category || 'all';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const rating = req.query.rating || 'all';

    // Get all categories or specific category
    let categories;
    if (categoryFilter !== 'all') {
      categories = await Category.find({ 
        _id: categoryFilter, 
        isVisible: true 
      }).sort({ title: 1 });
    } else {
      categories = await Category.find({ isVisible: true }).sort({ title: 1 });
    }

    const coursesByCategory = [];

    for (const category of categories) {
      // Build query for courses in this category
      let courseQuery = {
        category: category._id
      };

      // Apply status filter
      if (status === 'listed') {
        courseQuery.listed = true;
      } else if (status === 'unlisted') {
        courseQuery.listed = false;
      } else if (status === 'active') {
        courseQuery.isActive = true;
        courseQuery.isBanned = false;
      }

      // Apply search filter if provided
      if (search) {
        courseQuery.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Apply price filter
      if (minPrice !== null || maxPrice !== null) {
        const priceFilter = {};
        if (minPrice !== null) priceFilter.$gte = minPrice;
        if (maxPrice !== null) priceFilter.$lte = maxPrice;
        courseQuery.price = priceFilter;
      }

      // Apply rating filter
      if (rating !== 'all') {
        const minRating = parseInt(rating.replace('+', ''));
        courseQuery.average_rating = { $gte: minRating };
      }

      // Simple query without complex aggregation
      const courses = await Course.find(courseQuery)
        .populate('tutor', 'full_name profileImage')
        .sort({ createdAt: -1 })
        .lean();

      if (courses.length > 0) {
        const formattedCourses = courses.map(course => ({
          id: course._id,
          title: course.title,
          description: course.description,
          price: course.price,
          offer_percentage: course.offer_percentage,
          course_thumbnail: course.course_thumbnail,
          average_rating: course.average_rating || 0,
          total_reviews: course.total_reviews || 0,
          enrolled_count: course.enrolled_count || 0,
          listed: course.listed,
          isActive: course.isActive,
          isBanned: course.isBanned,
          tutor: {
            full_name: course.tutor?.full_name || 'Unknown',
            profileImage: course.tutor?.profileImage
          },
          createdAt: course.createdAt
        }));

        coursesByCategory.push({
          category: {
            id: category._id,
            title: category.title,
            description: category.description
          },
          courses: formattedCourses,
          totalCourses: courses.length
        });
      }
    }

    res.status(200).json({
      success: true,
      data: coursesByCategory,
      totalCategories: coursesByCategory.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
      error: error.message
    });
  }
};

export {
  getCoursesByCategory,
  getAllCourses,
  getAllCoursesGrouped,
  getCourseDetails,
  toggleCourseListing,
  refreshEnrollmentCounts,
  getLessonDetails,
  adminToggleLessonPublish
};