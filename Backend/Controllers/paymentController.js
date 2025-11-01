import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../Model/OrderModel.js';
import Cart from '../Model/CartModel.js';
import User from '../Model/usermodel.js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
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

    // Validate cart items have valid courses
    const invalidItems = cart.items.filter(item => !item.course);
    if (invalidItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some courses in cart are no longer available'
      });
    }

    // Calculate amounts
    const totalAmount = cart.totalAmount || 0;
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

    // Validate amount (Razorpay minimum is 100 paise = 1 INR)
    if (amountInPaise < 100) {
      throw new Error('Amount too small for Razorpay (minimum 1 INR)');
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise, // Amount in paise
      currency: 'INR',
      receipt: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // Max 40 chars
    });

    // Create order in database
    const order = new Order({
      user: userId,
      orderId: `ORD_${uuidv4()}`,
      razorpayOrderId: razorpayOrder.id,
      items: cart.items.map(item => ({
        course: item.course._id,
        price: item.course.price,
        discountedPrice: item.course.price - (item.course.price * (item.course.offer_percentage || 0) / 100)
      })),
      totalAmount,
      taxAmount,
      finalAmount
    });

    await order.save();

    res.status(200).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: order.orderId
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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

    // Update order status
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = 'paid';
    await order.save();

    // Enroll user in courses
    const user = await User.findById(order.user);
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

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: order.user },
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
      message: 'Payment verified successfully',
      orderId: order.orderId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// Get order details
export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      orderId,
      user: userId
    }).populate('items.course', 'title course_thumbnail');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
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