import { Course } from "../../Model/CourseModel.js";
import Order from "../../Model/OrderModel.js";
import User from "../../Model/usermodel.js";
import Lesson from "../../Model/LessonModel.js";
import { STATUS_CODES } from "../../constants/constants.js";

const getTutorDashboardStats = async (req, res) => {
  try {
    const tutorId = req.tutor._id;
    const { page = 1, limit = 5 } = req.query;

    // Get tutor's courses
    const tutorCourses = await Course.find({ tutor: tutorId });
    const courseIds = tutorCourses.map(course => course._id);

    // Calculate total students (unique enrollments across all courses, excluding blocked users)
    const totalStudentsResult = await User.aggregate([
      {
        $match: {
          'courses.course': { $in: courseIds },
          is_blocked: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          uniqueStudents: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          totalStudents: { $size: '$uniqueStudents' }
        }
      }
    ]);
    
    const totalStudents = totalStudentsResult[0]?.totalStudents || 0;

    // Calculate total revenue from tutor's wallet earnings
    const Wallet = (await import('../../Model/WalletModel.js')).default;
    const tutorWallet = await Wallet.findOne({ owner: tutorId, ownerType: 'Tutor' });
    const totalRevenue = tutorWallet ? tutorWallet.totalEarnings : 0;

    // Calculate total orders from tutor's courses
    const orderResult = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          'items.course': { $in: courseIds }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.course': { $in: courseIds }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const totalOrders = orderResult[0]?.totalOrders || 0;

    // Course statistics with proper aggregation
    const courseStats = await Course.aggregate([
      { $match: { tutor: tutorId } },
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          activeCourses: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$isActive', true] }, { $eq: ['$listed', true] }] },
                1,
                0
              ]
            }
          },
          listedCourses: {
            $sum: {
              $cond: [{ $eq: ['$listed', true] }, 1, 0]
            }
          },
          draftCourses: {
            $sum: {
              $cond: [{ $eq: ['$listed', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalCourses = courseStats[0]?.totalCourses || 0;
    const activeCourses = courseStats[0]?.activeCourses || 0;
    const listedCourses = courseStats[0]?.listedCourses || 0;
    const draftCourses = courseStats[0]?.draftCourses || 0;
    
    // Get total lessons count
    const totalLessons = await Lesson.countDocuments({ tutor: tutorId });

    // Get monthly revenue data for the current year from wallet transactions
    const currentYear = new Date().getFullYear();
    let monthlyRevenue = [];
    
    if (tutorWallet && tutorWallet.transactions.length > 0) {
      // Filter transactions for current year and credit/commission types
      const yearTransactions = tutorWallet.transactions.filter(transaction => {
        const transactionYear = new Date(transaction.createdAt).getFullYear();
        return transactionYear === currentYear && 
               (transaction.type === 'credit' || transaction.type === 'commission') &&
               transaction.status === 'completed';
      });

      // Group by month
      const monthlyData = {};
      yearTransactions.forEach(transaction => {
        const month = new Date(transaction.createdAt).getMonth() + 1;
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, orders: 0 };
        }
        monthlyData[month].revenue += transaction.amount;
        monthlyData[month].orders += 1;
      });

      // Convert to array format
      monthlyRevenue = Object.keys(monthlyData).map(month => ({
        _id: parseInt(month),
        revenue: monthlyData[month].revenue,
        orders: monthlyData[month].orders
      })).sort((a, b) => a._id - b._id);
    }

    // Get top performing courses with correct enrolled count
    const topCourses = await Course.aggregate([
      { $match: { tutor: tutorId } },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'course',
          as: 'lessons'
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
        $project: {
          title: 1,
          enrolled_count: { $size: '$enrolledUsers' },
          average_rating: 1,
          price: 1,
          listed: 1,
          isActive: 1,
          lessons_count: { $size: '$lessons' },
          category: { $arrayElemAt: ['$categoryInfo', 0] }
        }
      },
      { $sort: { enrolled_count: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    // Get student engagement data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const studentEngagement = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          'items.course': { $in: courseIds },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.course': { $in: courseIds }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          enrollments: { $sum: 1 },
          uniqueStudents: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          _id: 1,
          enrollments: 1,
          uniqueStudents: { $size: '$uniqueStudents' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get course completion rates
    const courseCompletionRates = await Course.aggregate([
      {
        $match: { tutor: tutorId }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'courses.course',
          as: 'enrolledUsers'
        }
      },
      {
        $lookup: {
          from: 'examattempts',
          localField: '_id',
          foreignField: 'course',
          as: 'completedExams'
        }
      },
      {
        $project: {
          title: 1,
          enrolled_count: 1,
          completedCount: {
            $size: {
              $filter: {
                input: '$completedExams',
                cond: { $eq: ['$$this.passed', true] }
              }
            }
          }
        }
      },
      {
        $project: {
          title: 1,
          enrolled_count: 1,
          completedCount: 1,
          completionRate: {
            $cond: {
              if: { $gt: ['$enrolled_count', 0] },
              then: { $multiply: [{ $divide: ['$completedCount', '$enrolled_count'] }, 100] },
              else: 0
            }
          }
        }
      }
    ]);

    // Get revenue by category from wallet transactions
    let revenueByCategory = [];
    
    if (tutorWallet && tutorWallet.transactions.length > 0) {
      // Get course-category mapping
      const courseCategoryMap = {};
      for (const course of tutorCourses) {
        const populatedCourse = await Course.findById(course._id).populate('category');
        if (populatedCourse && populatedCourse.category) {
          courseCategoryMap[course._id.toString()] = populatedCourse.category.title;
        }
      }

      // Group wallet transactions by category
      const categoryData = {};
      tutorWallet.transactions.forEach(transaction => {
        if ((transaction.type === 'credit' || transaction.type === 'commission') && 
            transaction.status === 'completed' && 
            transaction.metadata && 
            transaction.metadata.courseId) {
          
          const courseId = transaction.metadata.courseId.toString();
          const categoryTitle = courseCategoryMap[courseId] || 'Other';
          
          if (!categoryData[categoryTitle]) {
            categoryData[categoryTitle] = { revenue: 0, courseCount: new Set() };
          }
          categoryData[categoryTitle].revenue += transaction.amount;
          categoryData[categoryTitle].courseCount.add(courseId);
        }
      });

      // Convert to array format
      revenueByCategory = Object.keys(categoryData).map(category => ({
        _id: category,
        revenue: categoryData[category].revenue,
        courseCount: categoryData[category].courseCount.size
      })).sort((a, b) => b.revenue - a.revenue);
    }

    // Get daily activity for the last 30 days from wallet transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let dailyActivity = [];
    
    if (tutorWallet && tutorWallet.transactions.length > 0) {
      // Filter transactions for last 30 days
      const recentTransactions = tutorWallet.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= thirtyDaysAgo && 
               (transaction.type === 'credit' || transaction.type === 'commission') &&
               transaction.status === 'completed';
      });

      // Group by date
      const dailyData = {};
      recentTransactions.forEach(transaction => {
        const dateStr = new Date(transaction.createdAt).toISOString().split('T')[0];
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = { enrollments: 0, revenue: 0 };
        }
        dailyData[dateStr].enrollments += 1;
        dailyData[dateStr].revenue += transaction.amount;
      });

      // Convert to array format
      dailyActivity = Object.keys(dailyData).map(date => ({
        _id: date,
        enrollments: dailyData[date].enrollments,
        revenue: dailyData[date].revenue
      })).sort((a, b) => a._id.localeCompare(b._id));
    }

    // Get recent orders for this tutor's courses
    const recentOrders = await Order.find({
      status: 'paid',
      'items.course': { $in: courseIds }
    })
    .populate('user', 'name email')
    .populate('items.course', 'title price')
    .sort({ createdAt: -1 })
    .limit(5);

    res.status(STATUS_CODES.OK).json({
      totalStudents,
      totalCourses,
      activeCourses,
      listedCourses,
      draftCourses,
      totalLessons,
      totalRevenue,
      totalOrders,
      monthlyRevenue,
      topCourses,
      recentOrders,
      studentEngagement,
      courseCompletionRates,
      revenueByCategory,
      dailyActivity
    });
  } catch (error) {
    console.error('Tutor dashboard error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const getTutorCoursesPaginated = async (req, res) => {
  try {
    const tutorId = req.tutor._id;
    const { page = 1, limit = 5, search = '', status = 'all' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build match conditions
    const matchConditions = { tutor: tutorId };
    
    if (search) {
      matchConditions.title = { $regex: search, $options: 'i' };
    }
    
    if (status !== 'all') {
      if (status === 'active') {
        matchConditions.listed = true;
        matchConditions.isActive = true;
      } else if (status === 'inactive') {
        matchConditions.$or = [
          { listed: false },
          { isActive: false }
        ];
      }
    }
    

    
    // Get paginated courses with correct enrolled count
    const courses = await Course.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'course',
          as: 'lessons'
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
        $project: {
          title: 1,
          enrolled_count: { $size: '$enrolledUsers' },
          average_rating: 1,
          price: 1,
          listed: 1,
          isActive: 1,
          lessons_count: { $size: '$lessons' },
          category: { $arrayElemAt: ['$categoryInfo', 0] },
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);
    
    // Get total count for pagination
    const totalCourses = await Course.countDocuments(matchConditions);
    const totalPages = Math.ceil(totalCourses / parseInt(limit));
    

    
    res.status(STATUS_CODES.OK).json({
      courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCourses,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Tutor courses pagination error:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};



export {
  getTutorDashboardStats,
  getTutorCoursesPaginated
};
