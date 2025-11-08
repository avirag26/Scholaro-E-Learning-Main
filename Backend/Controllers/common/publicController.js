import { Course } from "../../Model/CourseModel.js";
import Category from "../../Model/CategoryModel.js";
import Tutor from "../../Model/TutorModel.js";
import mongoose from "mongoose";

const getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isVisible: true })
      .select('title description')
      .sort({ title: 1 });
    const formattedCategories = categories.map(category => ({
      id: category._id,
      title: category.title,
      description: category.description
    }));
    res.status(200).json({
      success: true,
      categories: formattedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories"
    });
  }
};

const getPublicCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const rating = req.query.rating ? parseFloat(req.query.rating) : null;
    const sort = req.query.sort || 'newest';
    let matchStage = {
      listed: true,
      isActive: true,
      isBanned: false
    };
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      matchStage.category = new mongoose.Types.ObjectId(category);
    }
    if (minPrice !== null || maxPrice !== null) {
      matchStage.price = {};
      if (minPrice !== null) matchStage.price.$gte = minPrice;
      if (maxPrice !== null) matchStage.price.$lte = maxPrice;
    }
    if (rating !== null) {
      matchStage.average_rating = { $gte: rating };
    }
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { average_rating: -1 };
        break;
      case 'popular':
        sortOption = { enrolled_count: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
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
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          tutor: {
            $arrayElemAt: ['$tutorInfo', 0]
          },
          category: {
            $arrayElemAt: ['$categoryInfo', 0]
          }
        }
      },
      {
        $project: {
          tutorInfo: 0,
          categoryInfo: 0,
          'tutor.password': 0,
          'tutor.refreshToken': 0,
          'tutor.passwordResetToken': 0,
          'tutor.passwordResetExpires': 0
        }
      },
      { $sort: sortOption },
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
      category: course.category,
      tutor: {
        _id: course.tutor._id,
        full_name: course.tutor.full_name,
        profileImage: course.tutor.profileImage
      },
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count,
      average_rating: course.average_rating,
      total_reviews: course.total_reviews,
      createdAt: course.createdAt,
    }));
    res.status(200).json({
      success: true,
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
      message: "Failed to fetch courses",
      error: error.message
    });
  }
};

const getCoursesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const rating = req.query.rating ? parseFloat(req.query.rating) : null;
    const sort = req.query.sort || 'newest';

    const category = await Category.findOne({
      _id: categoryId,
      isVisible: true
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or not available"
      });
    }

    let matchStage = {
      category: new mongoose.Types.ObjectId(categoryId),
      listed: true,
      isActive: true,
      isBanned: false
    };

    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice !== null || maxPrice !== null) {
      matchStage.price = {};
      if (minPrice !== null) matchStage.price.$gte = minPrice;
      if (maxPrice !== null) matchStage.price.$lte = maxPrice;
    }

    if (rating !== null) {
      matchStage.average_rating = { $gte: rating };
    }
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { average_rating: -1 };
        break;
      case 'popular':
        sortOption = { enrolled_count: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
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
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          tutor: {
            $arrayElemAt: ['$tutorInfo', 0]
          },
          category: {
            $arrayElemAt: ['$categoryInfo', 0]
          }
        }
      },
      {
        $project: {
          tutorInfo: 0,
          categoryInfo: 0,
          'tutor.password': 0,
          'tutor.refreshToken': 0,
          'tutor.passwordResetToken': 0,
          'tutor.passwordResetExpires': 0
        }
      },
      { $sort: sortOption },
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
      category: course.category,
      tutor: {
        _id: course.tutor._id,
        full_name: course.tutor.full_name,
        profileImage: course.tutor.profileImage
      },
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count,
      average_rating: course.average_rating,
      total_reviews: course.total_reviews,
      createdAt: course.createdAt,
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
      message: "Failed to fetch courses by category",
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
        message: "Invalid course ID format"
      });
    }

    // Use aggregation to get course with correct enrolled count
    const courseResult = await Course.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(courseId),
          listed: true,
          isActive: true,
          isBanned: false
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
            profileImage: '$tutor.profileImage',
            email: '$tutor.email',
            bio: '$tutor.bio',
            is_blocked: '$tutor.is_blocked'
          },
          lessons: {
            $map: {
              input: '$lessons',
              as: 'lesson',
              in: {
                _id: '$$lesson._id',
                title: '$$lesson.title',
                description: '$$lesson.description',
                duration: '$$lesson.duration'
              }
            }
          }
        }
      }
    ]);

    if (!courseResult || courseResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found or not available"
      });
    }

    const course = courseResult[0];

    if (course.tutor && course.tutor.is_blocked) {
      return res.status(404).json({
        success: false,
        message: "Course not found or not available"
      });
    }

    const formattedCourse = {
      id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      offer_percentage: course.offer_percentage || 0,
      category: course.category,
      tutor: course.tutor,
      course_thumbnail: course.course_thumbnail,
      enrolled_count: course.enrolled_count,
      average_rating: course.average_rating || 0,
      total_reviews: course.total_reviews || 0,
      lessons: course.lessons,
      duration: course.duration,
      level: course.level,
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

const getAllSubjects = async (req, res) => {
  try {
    // Get all unique subjects from verified tutors
    const subjects = await Tutor.aggregate([
      {
        $match: {
          is_verified: true,
          is_blocked: false,
          subjects: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: "$subjects"
      },
      {
        $group: {
          _id: "$subjects",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1, _id: 1 }
      },
      {
        $project: {
          subject: "$_id",
          tutorCount: "$count",
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
      error: error.message
    });
  }
};

const getPublicTutors = async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', subject = '' } = req.query;

    let query = {
      is_verified: true,
      is_blocked: false
    };

    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (subject) {
      query.subjects = { $in: [new RegExp(subject, 'i')] };
    }

    const tutors = await Tutor.find(query)
      .select('full_name profileImage bio subjects')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const totalTutors = await Tutor.countDocuments(query);

    res.status(200).json({
      success: true,
      tutors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTutors / limit),
        totalTutors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tutors",
      error: error.message
    });
  }
};

const getTutorDetails = async (req, res) => {
  try {
    const { tutorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tutor ID"
      });
    }

    const tutor = await Tutor.findOne({
      _id: tutorId,
      is_verified: true,
      is_blocked: false
    }).select('full_name profileImage bio subjects email');

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found or not available"
      });
    }

    // Get tutor's public courses
    const courses = await Course.find({
      tutor: tutorId,
      listed: true,
      isActive: true,
      isBanned: false
    })
      .populate('category', 'title')
      .select('title description price offer_percentage course_thumbnail average_rating total_reviews enrolled_count createdAt')
      .sort({ createdAt: -1 });

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
      category: course.category,
      createdAt: course.createdAt
    }));

    const tutorData = {
      _id: tutor._id,
      name: tutor.full_name,  // Add name field for frontend compatibility
      full_name: tutor.full_name,
      profileImage: tutor.profileImage,
      bio: tutor.bio,
      subjects: tutor.subjects,
      email: tutor.email,
      courses: formattedCourses,
      statistics: {
        totalCourses: courses.length,
        totalStudents: courses.reduce((sum, course) => sum + (course.enrolled_count || 0), 0),
        averageRating: courses.length > 0
          ? courses.reduce((sum, course) => sum + (course.average_rating || 0), 0) / courses.length
          : 0,
        totalReviews: courses.reduce((sum, course) => sum + (course.total_reviews || 0), 0)
      }
    };

    res.status(200).json({
      success: true,
      tutor: tutorData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tutor details",
      error: error.message
    });
  }
};



const getTutorStats = async (req, res) => {
  try {
    const { tutorId } = req.params;

    const tutor = await Tutor.findById(tutorId)
      .populate('courses', 'enrolled_count average_rating _id')
      .select('courses full_name bio profileImage subjects');

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    // Get course IDs for this tutor
    const courseIds = tutor.courses.map(course => course._id);

    // Calculate both student count and total enrollments from User model
    const User = (await import('../../Model/usermodel.js')).default;

    // Get unique students count
    const uniqueStudents = await User.aggregate([
      { $match: { 'courses.course': { $in: courseIds } } },
      { $group: { _id: '$_id' } },
      { $count: 'total' }
    ]);
    const studentCount = uniqueStudents[0]?.total || 0;

    // Calculate total enrollments (count all course enrollments, not unique students)
    const totalEnrollments = await User.aggregate([
      { $match: { 'courses.course': { $in: courseIds } } },
      { $unwind: '$courses' },
      { $match: { 'courses.course': { $in: courseIds } } },
      { $count: 'total' }
    ]);
    const enrollmentCount = totalEnrollments[0]?.total || 0;

    // Calculate average rating across all courses
    const totalRating = tutor.courses.reduce((sum, course) => sum + (course.average_rating || 0), 0);
    const averageRating = tutor.courses.length > 0 ? totalRating / tutor.courses.length : 0;

    const stats = {
      studentCount,
      totalCourses: tutor.courses.length,
      totalEnrollments: enrollmentCount,
      averageRating: parseFloat(averageRating.toFixed(1))
    };





    res.json({
      success: true,
      tutor: {
        _id: tutor._id,
        full_name: tutor.full_name,
        bio: tutor.bio,
        profileImage: tutor.profileImage,
        subjects: tutor.subjects
      },
      stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tutor stats',
      error: error.message
    });
  }
};

export {
  getPublicCategories,
  getPublicCourses,
  getCoursesByCategory,
  getCourseDetails,
  getAllSubjects,
  getPublicTutors,
  getTutorDetails,
  getTutorStats
};