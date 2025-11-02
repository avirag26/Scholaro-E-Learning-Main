import { Course } from "../../Model/CourseModel.js";
import Category from "../../Model/CategoryModel.js";
import mongoose from "mongoose";

const getCoursesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
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

      // Build aggregation pipeline
      let pipeline = [
        { $match: courseQuery },
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
        }
      ];

      // Add search filter if provided
      if (search) {
        pipeline.push({
          $match: {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          }
        });
      }

      // Add price filter if provided
      if (minPrice !== null || maxPrice !== null) {
        const priceMatch = {};
        if (minPrice !== null) priceMatch.$gte = minPrice;
        if (maxPrice !== null) priceMatch.$lte = maxPrice;
        pipeline.push({
          $match: { price: priceMatch }
        });
      }

      // Add rating filter if provided
      if (rating !== 'all') {
        const minRating = parseInt(rating.replace('+', ''));
        pipeline.push({
          $match: { average_rating: { $gte: minRating } }
        });
      }

      // Add projection and sorting
      pipeline.push(
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
            listed: 1,
            isActive: 1,
            isBanned: 1,
            createdAt: 1,
            tutor: { $arrayElemAt: ['$tutorInfo', 0] }
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
            listed: 1,
            isActive: 1,
            isBanned: 1,
            createdAt: 1,
            'tutor.full_name': 1,
            'tutor.profileImage': 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 10 } // Limit courses per category for overview
      );

      const courses = await Course.aggregate(pipeline);

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

const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }

    const course = await Course.findById(courseId)
      .populate('category', 'title description')
      .populate('tutor', 'full_name email profileImage bio')
      .populate('lessons', 'title description duration order');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const formattedCourse = {
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage,
      category: course.category,
      tutor: course.tutor,
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count || 0,
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

export {
  getCoursesByCategory,
  getAllCourses,
  getCourseDetails,
  toggleCourseListing
};