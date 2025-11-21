import Tutor from "../../Model/TutorModel.js";
import { Course } from "../../Model/CourseModel.js";
import mongoose from "mongoose";
import { STATUS_CODES } from "../../constants/constants.js";

const getAllTutors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    let query = {};
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status !== 'all') {
      if (status === 'verified') query.is_verified = true;
      if (status === 'unverified') query.is_verified = false;
      if (status === 'blocked') query.is_blocked = true;
      if (status === 'active') query.is_blocked = false;
    }
    const [tutors, totalTutors, listedCount, unlistedCount] = await Promise.all([
      Tutor.find(query)
        .select('-password -refreshToken')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Tutor.countDocuments(query),
      Tutor.countDocuments({ is_verified: true, is_blocked: false }),
      Tutor.countDocuments({ is_blocked: true })
    ]);

    res.status(STATUS_CODES.OK).json({
      data: tutors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTutors / limit),
        totalItems: totalTutors,
        hasNext: page < Math.ceil(totalTutors / limit),
        hasPrev: page > 1
      },
      stats: {
        total: totalTutors,
        listed: listedCount,
        unlisted: unlistedCount
      }
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const blockTutor = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Tutor not found" });
    }
    tutor.is_blocked = true;
    await tutor.save();
    res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Tutor blocked successfully"
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const unblockTutor = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Tutor not found" });
    }
    tutor.is_blocked = false;
    await tutor.save();
    res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Tutor unblocked successfully"
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const getTutorDetails = async (req, res) => {
  try {
    const { tutorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Invalid tutor ID"
      });
    }

    const tutor = await Tutor.findById(tutorId).select('-password -refreshToken');
    if (!tutor) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Tutor not found"
      });
    }

    // Get tutor's courses
    const courses = await Course.find({ tutor: tutorId })
      .populate('category', 'title')
      .select('title description price offer_percentage course_thumbnail average_rating total_reviews enrolled_count listed isActive createdAt')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, course) => sum + (course.enrolled_count || 0), 0);
    const totalReviews = courses.reduce((sum, course) => sum + (course.total_reviews || 0), 0);
    const averageRating = totalReviews > 0
      ? courses.reduce((sum, course) => sum + (course.average_rating || 0), 0) / courses.length
      : 0;

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
      category: course.category,
      createdAt: course.createdAt
    }));

    const tutorData = {
      _id: tutor._id,
      tutor_id: tutor.tutor_id,
      full_name: tutor.full_name,
      email: tutor.email,
      phone: tutor.phone,
      profileImage: tutor.profileImage,
      bio: tutor.bio,
      subjects: tutor.subjects,
      is_verified: tutor.is_verified,
      is_blocked: tutor.is_blocked,
      lastLogin: tutor.lastLogin,
      createdAt: tutor.createdAt,
      updatedAt: tutor.updatedAt,
      courses: formattedCourses,
      statistics: {
        totalCourses,
        totalStudents,
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1))
      }
    };

    res.status(STATUS_CODES.OK).json({
      success: true,
      tutor: tutorData
    });

  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch tutor details"
    });
  }
};

export {
  getAllTutors,
  blockTutor,
  unblockTutor,
  getTutorDetails
};
