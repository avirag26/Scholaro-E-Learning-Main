import User from '../../Model/usermodel.js';
import { Course } from '../../Model/CourseModel.js';
import Certificate from '../../Model/CertificateModel.js';
import ExamAttempt from '../../Model/ExamAttemptModel.js';
import Lesson from '../../Model/LessonModel.js';

export const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: 'courses.course',
      select: 'title course_thumbnail tutor lessons',
      populate: {
        path: 'tutor',
        select: 'full_name profileImage'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const enrolledCourses = user.courses || [];
    const coursesEnrolled = enrolledCourses.length;
    const coursesCompleted = enrolledCourses.filter(c => c.completionStatus).length;

    let totalHours = 0;
    const coursesWithProgress = [];

    for (const enrollment of enrolledCourses) {
      if (!enrollment.course) continue;

      const course = enrollment.course;
      const lessons = await Lesson.find({ course: course._id }).select('duration');
      const courseDuration = lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
      totalHours += courseDuration;

      // Use the same progress calculation as the existing system
      const progress = enrollment.progress || 0;

      coursesWithProgress.push({
        _id: course._id,
        title: course.title,
        instructor: course.tutor?.full_name || 'Unknown Instructor',
        progress: progress,
        thumbnail: course.course_thumbnail,
        duration: `${Math.round(courseDuration / 60)} hours`,
        enrollmentDate: enrollment.enrollmentDate,
        completionStatus: enrollment.completionStatus
      });
    }

    const certificates = await Certificate.countDocuments({ 
      userId, 
      isValid: true 
    });

    const userProgress = {
      coursesEnrolled,
      coursesCompleted,
      totalHours: Math.round(totalHours / 60),
      certificates
    };

    res.status(200).json({
      success: true,
      userProgress,
      enrolledCourses: coursesWithProgress.slice(0, 6)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

export const getFeaturedCourses = async (req, res) => {
  try {
    const courses = await Course.aggregate([
      {
        $match: { 
          listed: true, 
          isActive: true,
          isBanned: false 
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
          enrollmentCount: { $size: '$enrolledUsers' },
          tutor: { $arrayElemAt: ['$tutorInfo', 0] }
        }
      },
      {
        $sort: { enrollmentCount: -1 }
      },
      {
        $limit: 12
      },
      {
        $project: {
          title: 1,
          course_thumbnail: 1,
          tutor: {
            full_name: '$tutor.full_name',
            profileImage: '$tutor.profileImage'
          },
          rating: { $ifNull: ['$averageRating', 0] },
          reviews: { length: { $ifNull: ['$reviewCount', 0] } },
          price: 1,
          offer_percentage: { $ifNull: ['$offer_percentage', 0] },
          enrollmentCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured courses',
      error: error.message
    });
  }
};

export const getFeaturedTutors = async (req, res) => {
  try {
    // Import Tutor model
    const Tutor = (await import('../../Model/TutorModel.js')).default;
    
    const tutors = await Tutor.aggregate([
      {
        $match: {
          status: true,
          is_blocked: false
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'tutor',
          as: 'courses'
        }
      },
      {
        $addFields: {
          courseCount: { $size: '$courses' },
          totalEnrollments: { $sum: '$courses.enrollmentCount' }
        }
      },
      {
        $match: {
          courseCount: { $gt: 0 }
        }
      },
      // Add random sampling for variety
      {
        $sample: { size: 12 }
      },
      {
        $project: {
          full_name: 1,
          profileImage: { $ifNull: ['$profileImage', '$profile_image'] },
          subjects: 1,
          bio: 1,
          rating: { 
            $cond: {
              if: { $gt: ['$averageRating', 0] },
              then: '$averageRating',
              else: { $add: [4.0, { $multiply: [{ $rand: {} }, 1.0] }] }
            }
          },
          studentCount: { $ifNull: ['$student_count', { $floor: { $multiply: [{ $rand: {} }, 100] } }] },
          courseCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      tutors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured tutors',
      error: error.message
    });
  }
};

export const getPopularCategories = async (req, res) => {
  try {
    // Import Category model
    const Category = (await import('../../Model/CategoryModel.js')).default;
    
    const categories = await Category.aggregate([
      {
        $match: {
          isVisible: true
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'category',
          as: 'courses'
        }
      },
      {
        $addFields: {
          courseCount: {
            $size: {
              $filter: {
                input: '$courses',
                cond: {
                  $and: [
                    { $eq: ['$$this.listed', true] },
                    { $eq: ['$$this.isActive', true] },
                    { $eq: ['$$this.isBanned', false] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $match: {
          courseCount: { $gt: 0 }
        }
      },
      {
        $sort: { courseCount: -1 }
      },
      {
        $limit: 8
      },
      {
        $project: {
          name: 1,
          description: 1,
          courseCount: 1,
          icon: { $ifNull: ['$icon', '📚'] },
          color: { $ifNull: ['$color', 'bg-blue-100 text-blue-600'] }
        }
      }
    ]);

    // Add some default icons and colors if not set
    const categoryIcons = {
      'Design': '🎨',
      'Development': '💻',
      'Marketing': '📈',
      'Business': '💼',
      'Technology': '⚡',
      'Science': '🔬',
      'Arts': '🎭',
      'Music': '🎵',
      'Photography': '📸',
      'Writing': '✍️'
    };

    const categoryColors = [
      'bg-pink-100 text-pink-600',
      'bg-sky-100 text-sky-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-yellow-100 text-yellow-600',
      'bg-red-100 text-red-600',
      'bg-indigo-100 text-indigo-600',
      'bg-orange-100 text-orange-600'
    ];

    const enhancedCategories = categories.map((category, index) => ({
      ...category,
      icon: categoryIcons[category.name] || category.icon || '📚',
      color: category.color || categoryColors[index % categoryColors.length],
      courses: `${category.courseCount}+ Courses`
    }));

    res.status(200).json({
      success: true,
      categories: enhancedCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};