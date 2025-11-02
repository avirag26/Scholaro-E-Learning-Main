import Order from "../../Model/OrderModel.js";
import mongoose from "mongoose";

const getAllOrders = async (req, res) => {
  try {
    console.log('Admin getAllOrders called with query:', req.query);

    // First, let's check if there are any orders at all
    const orderCount = await Order.countDocuments();
    console.log('Total orders in database:', orderCount);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    console.log('Query:', query);

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // If no orders exist, return empty result
    if (orderCount === 0) {
      console.log('No orders found in database');
      return res.status(200).json({
        success: true,
        orders: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          hasNext: false,
          hasPrev: false
        },
        stats: {
          total: 0,
          paid: 0,
          pending: 0,
          failed: 0,
          totalRevenue: 0
        }
      });
    }

    const orders = await Order.find(query)
      .populate({
        path: 'user',
        select: 'full_name email phone profileImage'
      })
      .populate({
        path: 'items.course',
        select: 'title course_thumbnail price offer_percentage',
        populate: {
          path: 'tutor',
          select: 'full_name profileImage'
        }
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    console.log('Found orders:', orders.length);

    const totalOrders = await Order.countDocuments(query);

    // Format orders for response with null checks
    const formattedOrders = orders.map(order => ({
      id: order._id,
      orderId: order.orderId,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      user: order.user ? {
        id: order.user._id,
        name: order.user.full_name,
        email: order.user.email,
        phone: order.user.phone,
        profileImage: order.user.profileImage
      } : {
        id: null,
        name: 'Unknown User',
        email: 'N/A',
        phone: 'N/A',
        profileImage: null
      },
      items: order.items.map(item => ({
        course: item.course ? {
          id: item.course._id,
          title: item.course.title,
          thumbnail: item.course.course_thumbnail,
          price: item.price,
          discountedPrice: item.discountedPrice,
          tutor: {
            name: item.course.tutor?.full_name || 'Unknown',
            profileImage: item.course.tutor?.profileImage
          }
        } : {
          id: null,
          title: 'Course Not Found',
          thumbnail: null,
          price: item.price,
          discountedPrice: item.discountedPrice,
          tutor: {
            name: 'Unknown',
            profileImage: null
          }
        }
      })),
      totalAmount: order.totalAmount,
      taxAmount: order.taxAmount,
      finalAmount: order.finalAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    // Get statistics
    const stats = {
      total: await Order.countDocuments(),
      paid: await Order.countDocuments({ status: 'paid' }),
      pending: 0,
      failed: 0,
      totalRevenue: await Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]).then(result => result[0]?.total || 0)
    };

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalItems: totalOrders,
        hasNext: page < Math.ceil(totalOrders / limit),
        hasPrev: page > 1
      },
      stats
    });

  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(orderId)
      .populate({
        path: 'user',
        select: 'full_name email phone profileImage user_id createdAt lastLogin'
      })
      .populate({
        path: 'items.course',
        select: 'title description course_thumbnail price offer_percentage level duration category',
        populate: [
          {
            path: 'tutor',
            select: 'full_name email profileImage bio subjects'
          },
          {
            path: 'category',
            select: 'title description'
          }
        ]
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Format detailed order response with null checks
    const orderDetails = {
      id: order._id,
      orderId: order.orderId,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      razorpaySignature: order.razorpaySignature,

      // Student details
      student: order.user ? {
        id: order.user._id,
        userId: order.user.user_id,
        name: order.user.full_name,
        email: order.user.email,
        phone: order.user.phone,
        profileImage: order.user.profileImage,
        memberSince: order.user.createdAt,
        lastLogin: order.user.lastLogin
      } : {
        id: null,
        userId: null,
        name: 'Unknown User',
        email: 'N/A',
        phone: 'N/A',
        profileImage: null,
        memberSince: null,
        lastLogin: null
      },

      // Course and tutor details
      courses: order.items.map(item => item.course ? ({
        id: item.course._id,
        title: item.course.title,
        description: item.course.description,
        thumbnail: item.course.course_thumbnail,
        originalPrice: item.price,
        discountedPrice: item.discountedPrice,
        savings: item.price - item.discountedPrice,
        level: item.course.level,
        duration: item.course.duration,
        category: {
          title: item.course.category?.title || 'General',
          description: item.course.category?.description
        },
        tutor: item.course.tutor ? {
          id: item.course.tutor._id,
          name: item.course.tutor.full_name,
          email: item.course.tutor.email,
          profileImage: item.course.tutor.profileImage,
          bio: item.course.tutor.bio,
          subjects: item.course.tutor.subjects
        } : {
          id: null,
          name: 'Unknown Tutor',
          email: 'N/A',
          profileImage: null,
          bio: 'N/A',
          subjects: 'N/A'
        }
      }) : ({
        id: null,
        title: 'Course Not Found',
        description: 'This course is no longer available',
        thumbnail: null,
        originalPrice: item.price,
        discountedPrice: item.discountedPrice,
        savings: item.price - item.discountedPrice,
        level: 'N/A',
        duration: 'N/A',
        category: {
          title: 'General',
          description: 'N/A'
        },
        tutor: {
          id: null,
          name: 'Unknown Tutor',
          email: 'N/A',
          profileImage: null,
          bio: 'N/A',
          subjects: 'N/A'
        }
      })),

      // Payment details
      payment: {
        subtotal: order.totalAmount,
        tax: order.taxAmount,
        total: order.finalAmount,
        status: order.status,
        paymentMethod: 'Razorpay',
        transactionId: order.razorpayPaymentId
      },

      // Order timeline
      timeline: {
        orderCreated: order.createdAt,
        paymentCompleted: order.status === 'paid' ? order.updatedAt : null,
        lastUpdated: order.updatedAt
      },

      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.status(200).json({
      success: true,
      order: orderDetails
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const validStatuses = ['paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Valid status is: paid (completed)"
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('user', 'full_name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        id: order._id,
        orderId: order.orderId,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message
    });
  }
};

const getOrderStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await Order.aggregate([
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$finalAmount', 0] } },
                paidOrders: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
                pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
              }
            }
          ],
          recentStats: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: null,
                recentOrders: { $sum: 1 },
                recentRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$finalAmount', 0] } }
              }
            }
          ],
          dailyStats: [
            { $match: { createdAt: { $gte: startDate }, status: 'paid' } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                orders: { $sum: 1 },
                revenue: { $sum: '$finalAmount' }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const result = {
      total: stats[0].totalStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        paidOrders: 0,
        pendingOrders: 0
      },
      recent: stats[0].recentStats[0] || {
        recentOrders: 0,
        recentRevenue: 0
      },
      daily: stats[0].dailyStats || []
    };

    res.status(200).json({
      success: true,
      stats: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message
    });
  }
};



export {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  getOrderStats
};