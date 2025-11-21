import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../../Model/OrderModel.js';
import Cart from '../../Model/CartModel.js';
import User from '../../Model/usermodel.js';
import PaymentDistribution from '../../Model/PaymentDistributionModel.js';
import { Course } from '../../Model/CourseModel.js';
import Coupon from '../../Model/CouponModel.js';
import { v4 as uuidv4 } from 'uuid';
import { notifyAdminNewOrder, notifyTutorWalletCredit } from '../../utils/notificationHelper.js';


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { appliedCoupons = {} } = req.body;


    const cart = await Cart.findOne({ user: userId }).populate('items.course');
    if (!cart || cart.items.length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Cart is empty'
      });
    }


    const availableItems = cart.items.filter(item => {
      const course = item.course;
      return course && course.listed && course.isActive && !course.isBanned;
    });

    if (availableItems.length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'No available courses in cart. Please remove unavailable courses and try again.'
      });
    }


    const totalAmount = availableItems.reduce((total, item) => {
      const course = item.course;
      const discountedPrice = course.price - (course.price * (course.offer_percentage || 0) / 100);
      return total + discountedPrice;
    }, 0);


    let totalCouponDiscount = 0;
    if (Object.keys(appliedCoupons).length > 0) {
      totalCouponDiscount = Object.values(appliedCoupons).reduce((total, couponInfo) => {
        return total + (couponInfo.discountAmount || 0);
      }, 0);
    }

    const subtotalAfterCoupons = Math.max(0, totalAmount - totalCouponDiscount);

    if (subtotalAfterCoupons <= 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid cart total amount after discounts'
      });
    }

    const taxAmount = subtotalAfterCoupons * 0.03; // 3% tax
    const finalAmount = subtotalAfterCoupons + taxAmount;


    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }


    const amountInPaise = Math.round(finalAmount * 100);
    const actualFinalAmount = amountInPaise / 100;
    

    const actualTaxAmount = actualFinalAmount - subtotalAfterCoupons;

    if (amountInPaise < 100) {
      throw new Error('Amount too small for Razorpay (minimum 1 INR)');
    }

 
    const tempOrderId = `ORD_${uuidv4().split('-')[0]}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `ord_${Math.random().toString(36).substring(2, 8)}`,
      notes: {
        userId: userId.toString(),
        tempOrderId: tempOrderId,
        totalAmount: totalAmount.toString(),
        couponDiscount: totalCouponDiscount.toString(),
        subtotalAfterCoupons: subtotalAfterCoupons.toString(),
        taxAmount: taxAmount.toString(),
        finalAmount: finalAmount.toString(),
        appliedCoupons: Object.keys(appliedCoupons).length > 0 ? JSON.stringify(appliedCoupons) : ''
      }
    });



    res.status(STATUS_CODES.OK).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: tempOrderId
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};


export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;


    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    
    const razorpayOrderDetails = await razorpay.orders.fetch(razorpay_order_id);
    if (!razorpayOrderDetails) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Razorpay order not found'
      });
    }

    
    if (razorpayOrderDetails.notes.userId !== userId.toString()) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'Unauthorized payment verification'
      });
    }


    const cart = await Cart.findOne({ user: userId }).populate('items.course');
    if (!cart || cart.items.length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Cart is empty - cannot complete order'
      });
    }

    const availableItems = cart.items.filter(item => {
      const course = item.course;
      return course && course.listed && course.isActive && !course.isBanned;
    });

    if (availableItems.length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'No available courses in cart'
      });
    }


    const totalAmount = availableItems.reduce((total, item) => {
      const course = item.course;
      const discountedPrice = course.price - (course.price * (course.offer_percentage || 0) / 100);
      return total + discountedPrice;
    }, 0);


    let appliedCoupons = {};
    let totalCouponDiscount = 0;

    if (razorpayOrderDetails.notes.appliedCoupons) {
      try {
        appliedCoupons = JSON.parse(razorpayOrderDetails.notes.appliedCoupons);
        totalCouponDiscount = parseFloat(razorpayOrderDetails.notes.couponDiscount || '0');
      } catch (e) {
        console.error('Error parsing applied coupons:', e);
      }
    }

    const subtotalAfterCoupons = Math.max(0, totalAmount - totalCouponDiscount);
    const taxAmount = subtotalAfterCoupons * 0.03;
    const finalAmount = subtotalAfterCoupons + taxAmount;
    const amountInPaise = Math.round(finalAmount * 100);
    const actualFinalAmount = amountInPaise / 100;
    const actualTaxAmount = actualFinalAmount - subtotalAfterCoupons;


    if (razorpayOrderDetails.amount !== amountInPaise) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Payment amount mismatch'
      });
    }


    const couponUsagePromises = [];
    if (Object.keys(appliedCoupons).length > 0) {
      for (const [tutorId, couponInfo] of Object.entries(appliedCoupons)) {
        if (couponInfo.couponId && couponInfo.discountAmount) {
          couponUsagePromises.push(
            Coupon.findById(couponInfo.couponId).then(coupon => {
              if (coupon) {
                return coupon.useCoupon(userId, null, couponInfo.discountAmount); 
              }
            })
          );
        }
      }
    }

    await Promise.all(couponUsagePromises);


    const order = new Order({
      user: userId,
      orderId: razorpayOrderDetails.notes.tempOrderId || `ORD_${uuidv4()}`,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      items: availableItems.map(item => ({
        course: item.course._id,
        price: item.course.price,
        discountedPrice: item.course.price - (item.course.price * (item.course.offer_percentage || 0) / 100)
      })),
      totalAmount,
      couponDiscount: totalCouponDiscount,
      appliedCoupons: Object.keys(appliedCoupons).length > 0 ? appliedCoupons : undefined,
      subtotalAfterCoupons,
      taxAmount: actualTaxAmount,
      finalAmount: actualFinalAmount,
      status: 'paid' 
    });

    await order.save();

    if (Object.keys(appliedCoupons).length > 0) {
      for (const [tutorId, couponInfo] of Object.entries(appliedCoupons)) {
        if (couponInfo.couponId) {
          await Coupon.findByIdAndUpdate(
            couponInfo.couponId,
            { $set: { "usageHistory.$[elem].orderId": order._id } },
            { arrayFilters: [{ "elem.userId": userId, "elem.orderId": { $exists: false } }] }
          );
        }
      }
    }

    const user = await User.findById(userId);

    await notifyAdminNewOrder(order.orderId, order.finalAmount, user.email);
    for (const item of order.items) {
      const isAlreadyEnrolled = user.courses.some(c => c.course.toString() === item.course.toString());
      if (!isAlreadyEnrolled) {
        user.courses.push({
          course: item.course,
          enrollmentDate: new Date(),
          progress: 0,
          completionStatus: false
        });
      }
    }
    await user.save();


    await createPaymentDistribution(order);


    await Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          items: [],
          totalAmount: 0,
          totalItems: 0
        }
      }
    );

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Payment verified successfully and order created',
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};


const createPaymentDistribution = async (order) => {
  try {

    const orderWithCourses = await Order.findById(order._id).populate({
      path: 'items.course',
      select: 'title tutor',
      populate: {
        path: 'tutor',
        select: '_id full_name email'
      }
    });

    const tutorGroups = {};
    const appliedCoupons = order.appliedCoupons || {};

  
    for (const item of orderWithCourses.items) {
      const tutorId = item.course.tutor._id.toString();

      if (!tutorGroups[tutorId]) {
        tutorGroups[tutorId] = {
          tutor: item.course.tutor,
          courses: [],
          totalOriginalAmount: 0,
          couponDiscount: appliedCoupons[tutorId]?.discountAmount || 0
        };
      }

      const courseOriginalAmount = item.discountedPrice; 
      tutorGroups[tutorId].courses.push({
        courseId: item.course._id,
        originalAmount: courseOriginalAmount
      });
      tutorGroups[tutorId].totalOriginalAmount += courseOriginalAmount;
    }

    const totalDistributionAmount = Object.values(tutorGroups).reduce((sum, group) => {
      return sum + Math.max(0, group.totalOriginalAmount - group.couponDiscount);
    }, 0);

    for (const tutorId in tutorGroups) {
      const tutorGroup = tutorGroups[tutorId];
      const totalOriginal = tutorGroup.totalOriginalAmount;
      const totalCouponDiscount = tutorGroup.couponDiscount;


      const totalActualAmount = Math.max(0, totalOriginal - totalCouponDiscount);

      const distributionData = {
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        totalAmount: totalActualAmount, 
        tutor: tutorId,
        user: order.user,
        courses: tutorGroup.courses.map(course => ({
          courseId: course.courseId,
          amount: course.originalAmount 
        }))
      };

      await PaymentDistribution.createDistribution(distributionData);
    }
  } catch (error) {
    console.error('Error creating payment distribution:', error);
  }
};

export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      orderId,
      user: userId,
      status: 'paid' 
    }).populate('items.course', 'title course_thumbnail')
      .populate('user', 'full_name email phone profileImage');

    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Order not found or payment not completed'
      });
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};


export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      orderId,
      user: userId
    }).populate('items.course', 'title course_thumbnail')
      .populate('user', 'full_name email');

    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Order not found'
      });
    }


    const invoiceData = {
      orderId: order.orderId,
      date: order.createdAt.toLocaleDateString(),
      customerName: order.user.full_name,
      customerEmail: order.user.email,
      items: order.items.map(item => ({
        courseName: item.course.title,
        price: item.price,
        discountedPrice: item.discountedPrice
      })),
      subtotal: order.totalAmount,
      tax: order.taxAmount,
      total: order.finalAmount,
      paymentStatus: order.status
    };

    res.status(STATUS_CODES.OK).json({
      success: true,
      invoice: invoiceData
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message
    });
  }
};


export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const query = { user: userId, status: 'paid' };


    let sortOptions = {};
    switch (sort) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'amount_high':
        sortOptions = { finalAmount: -1 };
        break;
      case 'amount_low':
        sortOptions = { finalAmount: 1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const orders = await Order.find(query)
      .populate('items.course', 'title course_thumbnail')
      .populate('user', 'full_name email phone profileImage')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalOrders = await Order.countDocuments(query);

    res.status(STATUS_CODES.OK).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders
      }
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Direct course enrollment (single course purchase)
export const createDirectOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId, appliedCoupon = null } = req.body;

    // Validate course
    const course = await Course.findById(courseId);
    if (!course || !course.listed || !course.isActive || course.isBanned) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Course is not available for purchase'
      });
    }

    // Check if user already enrolled
    const user = await User.findById(userId);
    const isEnrolled = user.courses.some(c => c.course.toString() === courseId);
    if (isEnrolled) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Calculate price
    const discountedPrice = course.price - (course.price * (course.offer_percentage || 0) / 100);
    let totalAmount = discountedPrice;

    // Apply coupon if provided
    let couponDiscount = 0;
    let couponData = null;
    if (appliedCoupon && appliedCoupon.couponId) {
      try {
        const coupon = await Coupon.findById(appliedCoupon.couponId);
        if (coupon && coupon.tutor.toString() === course.tutor.toString()) {
          // Validate coupon
          const validation = await coupon.validateForUser(userId, [courseId], totalAmount);
          if (validation.isValid) {
            couponDiscount = appliedCoupon.discountAmount;
            couponData = appliedCoupon;
          }
        }
      } catch (error) {
        console.error('Coupon validation error:', error);
      }
    }

    const subtotalAfterCoupons = Math.max(0, totalAmount - couponDiscount);
    
    if (subtotalAfterCoupons <= 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid course price after discounts'
      });
    }

    const taxAmount = subtotalAfterCoupons * 0.03; // 3% tax
    const finalAmount = subtotalAfterCoupons + taxAmount;

    // Create Razorpay order
    const amountInPaise = Math.round(finalAmount * 100);
    const actualFinalAmount = amountInPaise / 100;
    const actualTaxAmount = actualFinalAmount - subtotalAfterCoupons;

    if (amountInPaise < 100) {
      throw new Error('Amount too small for Razorpay (minimum 1 INR)');
    }

    const tempOrderId = `ORD_${uuidv4().split('-')[0]}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `ord_${Math.random().toString(36).substring(2, 8)}`,
      notes: {
        userId: userId.toString(),
        tempOrderId: tempOrderId,
        courseId: courseId,
        totalAmount: totalAmount.toString(),
        couponDiscount: couponDiscount.toString(),
        subtotalAfterCoupons: subtotalAfterCoupons.toString(),
        taxAmount: taxAmount.toString(),
        finalAmount: finalAmount.toString(),
        appliedCoupon: couponData ? JSON.stringify(couponData) : '',
        isDirect: 'true'
      }
    });

    res.status(STATUS_CODES.OK).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: tempOrderId
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating direct order:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Verify direct enrollment payment
export const verifyDirectPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get Razorpay order details
    const razorpayOrderDetails = await razorpay.orders.fetch(razorpay_order_id);
    if (!razorpayOrderDetails || razorpayOrderDetails.notes.userId !== userId.toString()) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'Unauthorized payment verification'
      });
    }

    // Validate course
    const courseId = razorpayOrderDetails.notes.courseId;
    const course = await Course.findById(courseId);
    if (!course || !course.listed || !course.isActive || course.isBanned) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Course is no longer available'
      });
    }

    // Check if user already enrolled
    const user = await User.findById(userId);
    const isEnrolled = user.courses.some(c => c.course.toString() === courseId);
    if (isEnrolled) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Parse payment details
    const totalAmount = parseFloat(razorpayOrderDetails.notes.totalAmount);
    const couponDiscount = parseFloat(razorpayOrderDetails.notes.couponDiscount || '0');
    const subtotalAfterCoupons = parseFloat(razorpayOrderDetails.notes.subtotalAfterCoupons);
    const finalAmount = parseFloat(razorpayOrderDetails.notes.finalAmount);
    const actualTaxAmount = finalAmount - subtotalAfterCoupons;

    // Handle coupon usage
    let appliedCoupon = null;
    if (razorpayOrderDetails.notes.appliedCoupon) {
      try {
        appliedCoupon = JSON.parse(razorpayOrderDetails.notes.appliedCoupon);
        if (appliedCoupon.couponId) {
          const coupon = await Coupon.findById(appliedCoupon.couponId);
          if (coupon) {
            await coupon.useCoupon(userId, null, couponDiscount);
          }
        }
      } catch (e) {
        console.error('Error processing coupon:', e);
      }
    }

    // Create order
    const order = new Order({
      user: userId,
      orderId: razorpayOrderDetails.notes.tempOrderId || `ORD_${uuidv4()}`,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      items: [{
        course: courseId,
        price: course.price,
        discountedPrice: totalAmount
      }],
      totalAmount,
      couponDiscount,
      appliedCoupons: appliedCoupon ? { [course.tutor]: appliedCoupon } : undefined,
      subtotalAfterCoupons,
      taxAmount: actualTaxAmount,
      finalAmount,
      status: 'paid'
    });

    await order.save();

    // Update coupon with order ID
    if (appliedCoupon && appliedCoupon.couponId) {
      await Coupon.findByIdAndUpdate(
        appliedCoupon.couponId,
        { $set: { "usageHistory.$[elem].orderId": order._id } },
        { arrayFilters: [{ "elem.userId": userId, "elem.orderId": { $exists: false } }] }
      );
    }

    // Enroll user in course
    user.courses.push({
      course: courseId,
      enrollmentDate: new Date(),
      progress: 0,
      completionStatus: false
    });
    await user.save();

    // Create payment distribution
    await createPaymentDistribution(order);

    // Send notifications
    await notifyAdminNewOrder(order.orderId, order.finalAmount, user.email);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Payment verified successfully and course enrolled',
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Error verifying direct payment:', error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};
