import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../../Model/OrderModel.js';
import Cart from '../../Model/CartModel.js';
import User from '../../Model/usermodel.js';
import PaymentDistribution from '../../Model/PaymentDistributionModel.js';
import { Course } from '../../Model/CourseModel.js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create temporary Razorpay order (no database order yet)
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.course');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Filter available courses only
    const availableItems = cart.items.filter(item => {
      const course = item.course;
      return course && course.listed && course.isActive && !course.isBanned;
    });

    if (availableItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available courses in cart. Please remove unavailable courses and try again.'
      });
    }

    // Calculate amounts for available items only
    const totalAmount = availableItems.reduce((total, item) => {
      const course = item.course;
      const discountedPrice = course.price - (course.price * (course.offer_percentage || 0) / 100);
      return total + discountedPrice;
    }, 0);
    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart total amount'
      });
    }

    const taxAmount = totalAmount * 0.03; // 3% tax
    const finalAmount = totalAmount + taxAmount;

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    // Create Razorpay order
    const amountInPaise = Math.round(finalAmount * 100);

    if (amountInPaise < 100) {
      throw new Error('Amount too small for Razorpay (minimum 1 INR)');
    }

    // Generate a temporary order ID for tracking
    const tempOrderId = `ORD_${uuidv4()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise, 
      currency: 'INR',
      receipt: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // Max 40 chars
      notes: {
        userId: userId.toString(),
        tempOrderId: tempOrderId,
        totalAmount: totalAmount.toString(),
        taxAmount: taxAmount.toString(),
        finalAmount: finalAmount.toString()
      }
    });



    res.status(200).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: tempOrderId // This will be used for success page navigation
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Verify payment and create actual order
export const verifyPayment = async (req, res) => {
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
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get Razorpay order details to retrieve stored data
    const razorpayOrderDetails = await razorpay.orders.fetch(razorpay_order_id);
    if (!razorpayOrderDetails) {
      return res.status(404).json({
        success: false,
        message: 'Razorpay order not found'
      });
    }

    // Verify the user matches
    if (razorpayOrderDetails.notes.userId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized payment verification'
      });
    }

    // Get user's cart at the time of payment verification
    const cart = await Cart.findOne({ user: userId }).populate('items.course');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty - cannot complete order'
      });
    }

    // Filter available courses only (re-check availability)
    const availableItems = cart.items.filter(item => {
      const course = item.course;
      return course && course.listed && course.isActive && !course.isBanned;
    });

    if (availableItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available courses in cart'
      });
    }

    // Calculate amounts (re-verify amounts match payment)
    const totalAmount = availableItems.reduce((total, item) => {
      const course = item.course;
      const discountedPrice = course.price - (course.price * (course.offer_percentage || 0) / 100);
      return total + discountedPrice;
    }, 0);

    const taxAmount = totalAmount * 0.03;
    const finalAmount = totalAmount + taxAmount;
    const amountInPaise = Math.round(finalAmount * 100);

    // Verify payment amount matches
    if (razorpayOrderDetails.amount !== amountInPaise) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch'
      });
    }

    // NOW create the actual order in database (only after successful payment)
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
      taxAmount,
      finalAmount,
      status: 'paid' // Order is created only after successful payment
    });

    await order.save();

    // Enroll user in courses
    const user = await User.findById(userId);
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

    // Create payment distribution record for wallet system
    await createPaymentDistribution(order);

    // Clear user's cart
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

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully and order created',
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// Helper function to create payment distribution
const createPaymentDistribution = async (order) => {
  try {
    // Get course details with tutor information
    const orderWithCourses = await Order.findById(order._id).populate({
      path: 'items.course',
      select: 'title tutor',
      populate: {
        path: 'tutor',
        select: '_id full_name email'
      }
    });


    const tutorGroups = {};
    
    for (const item of orderWithCourses.items) {
      const tutorId = item.course.tutor._id.toString();
      
      if (!tutorGroups[tutorId]) {
        tutorGroups[tutorId] = {
          tutor: item.course.tutor,
          courses: [],
          totalAmount: 0
        };
      }
      
      tutorGroups[tutorId].courses.push({
        courseId: item.course._id,
        amount: item.discountedPrice
      });
      tutorGroups[tutorId].totalAmount += item.discountedPrice;
    }

  
    for (const tutorId in tutorGroups) {
      const tutorGroup = tutorGroups[tutorId];
      
      const distributionData = {
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        totalAmount: tutorGroup.totalAmount,
        tutor: tutorId,
        user: order.user,
        courses: tutorGroup.courses
      };

      await PaymentDistribution.createDistribution(distributionData);
    }
  } catch (error) {
    console.error('Error creating payment distribution:', error);
  }
};

// Get order details
export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      orderId,
      user: userId,
      status: 'paid' // Only return paid orders
    }).populate('items.course', 'title course_thumbnail')
      .populate('user', 'full_name email phone profileImage');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or payment not completed'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Generate invoice for order
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
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Generate invoice content
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

    res.status(200).json({
      success: true,
      invoice: invoiceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating invoice',
      error: error.message
    });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    // Build query - only get paid orders since we only save successful payments
    const query = { user: userId, status: 'paid' };

    // Build sort options
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

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};