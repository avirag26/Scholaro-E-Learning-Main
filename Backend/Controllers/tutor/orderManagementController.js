import Order from "../../Model/OrderModel.js";
import mongoose from "mongoose";

const getTutorOrders = async (req, res) => {
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    // Build aggregation pipeline to find orders containing tutor's courses
    let pipeline = [
      {
        $lookup: {
          from: 'courses',
          localField: 'items.course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      {
        $match: {
          'courseDetails.tutor': req.tutor._id
        }
      }
    ];

    // Add search filter
    if (search) {
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      });
      pipeline.push({
        $match: {
          $or: [
            { orderId: { $regex: search, $options: 'i' } },
            { razorpayOrderId: { $regex: search, $options: 'i' } },
            { razorpayPaymentId: { $regex: search, $options: 'i' } },
            { 'userDetails.full_name': { $regex: search, $options: 'i' } },
            { 'userDetails.email': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add status filter
    if (status !== 'all') {
      pipeline.push({
        $match: { status: status }
      });
    }

    // Add sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortOptions });

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Order.aggregate(countPipeline);
    const totalOrders = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Add population for final result
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'items.course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      {
        $addFields: {
          user: { $arrayElemAt: ['$user', 0] },
          // Filter items to only include tutor's courses
          items: {
            $filter: {
              input: {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: {
                    $mergeObjects: [
                      '$$item',
                      {
                        course: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$courseDetails',
                                cond: { $eq: ['$$this._id', '$$item.course'] }
                              }
                            },
                            0
                          ]
                        }
                      }
                    ]
                  }
                }
              },
              cond: { $eq: ['$$this.course.tutor', req.tutor._id] }
            }
          }
        }
      }
    );

    const orders = await Order.aggregate(pipeline);

    // Format orders for response
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
          discountedPrice: item.discountedPrice
        } : {
          id: null,
          title: 'Course Not Found',
          thumbnail: null,
          price: item.price,
          discountedPrice: item.discountedPrice
        }
      })),
      totalAmount: order.totalAmount,
      taxAmount: order.taxAmount,
      finalAmount: order.finalAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    // Get statistics for tutor's courses
    const statsResult = await Order.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'items.course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      {
        $match: {
          'courseDetails.tutor': req.tutor._id
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'paid'] }, 
                {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$items',
                          cond: {
                            $in: [
                              '$$this.course',
                              {
                                $map: {
                                  input: {
                                    $filter: {
                                      input: '$courseDetails',
                                      cond: { $eq: ['$$this.tutor', req.tutor._id] }
                                    }
                                  },
                                  in: '$$this._id'
                                }
                              }
                            ]
                          }
                        }
                      },
                      in: '$$this.discountedPrice'
                    }
                  }
                },
                0
              ]
            }
          },
          paidOrders: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
        }
      }
    ]);

    const stats = statsResult.length > 0 ? statsResult[0] : {
      totalOrders: 0,
      totalRevenue: 0,
      paidOrders: 0,
      pendingOrders: 0
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
};

const getTutorOrderDetails = async (req, res) => {
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
        select: 'title description course_thumbnail price offer_percentage level duration category tutor',
        populate: [
          {
            path: 'tutor',
            select: 'full_name email profileImage'
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

    // Check if this order contains tutor's courses
    const tutorCourses = order.items.filter(item => 
      item.course && item.course.tutor && 
      item.course.tutor._id.toString() === req.tutor._id.toString()
    );

    if (tutorCourses.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this order"
      });
    }

    // Format detailed order response
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

      // Only tutor's courses
      courses: tutorCourses.map(item => ({
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
        }
      })),

      // Payment details (proportional to tutor's courses)
      payment: {
        subtotal: tutorCourses.reduce((sum, item) => sum + item.price, 0),
        discount: tutorCourses.reduce((sum, item) => sum + (item.price - item.discountedPrice), 0),
        total: tutorCourses.reduce((sum, item) => sum + item.discountedPrice, 0),
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

const getTutorOrderStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await Order.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'items.course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      {
        $match: {
          'courseDetails.tutor': req.tutor._id
        }
      },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { 
                  $sum: { 
                    $cond: [
                      { $eq: ['$status', 'paid'] }, 
                      {
                        $sum: {
                          $map: {
                            input: {
                              $filter: {
                                input: '$items',
                                cond: {
                                  $in: [
                                    '$$this.course',
                                    {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: '$courseDetails',
                                            cond: { $eq: ['$$this.tutor', req.tutor._id] }
                                          }
                                        },
                                        in: '$$this._id'
                                      }
                                    }
                                  ]
                                }
                              }
                            },
                            in: '$$this.discountedPrice'
                          }
                        }
                      },
                      0
                    ]
                  }
                },
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
                recentRevenue: { 
                  $sum: { 
                    $cond: [
                      { $eq: ['$status', 'paid'] }, 
                      {
                        $sum: {
                          $map: {
                            input: {
                              $filter: {
                                input: '$items',
                                cond: {
                                  $in: [
                                    '$$this.course',
                                    {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: '$courseDetails',
                                            cond: { $eq: ['$$this.tutor', req.tutor._id] }
                                          }
                                        },
                                        in: '$$this._id'
                                      }
                                    }
                                  ]
                                }
                              }
                            },
                            in: '$$this.discountedPrice'
                          }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          ],
          dailyStats: [
            { $match: { createdAt: { $gte: startDate }, status: 'paid' } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                orders: { $sum: 1 },
                revenue: { 
                  $sum: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$items',
                            cond: {
                              $in: [
                                '$$this.course',
                                {
                                  $map: {
                                    input: {
                                      $filter: {
                                        input: '$courseDetails',
                                        cond: { $eq: ['$$this.tutor', req.tutor._id] }
                                      }
                                    },
                                    in: '$$this._id'
                                  }
                                }
                              ]
                            }
                          }
                        },
                        in: '$$this.discountedPrice'
                      }
                    }
                  }
                }
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
  getTutorOrders,
  getTutorOrderDetails,
  getTutorOrderStats
};