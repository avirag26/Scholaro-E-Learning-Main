import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'courses',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discountedPrice: {
    type: Number,
    required: true
  }
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  items: [OrderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  appliedCoupons: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  subtotalAfterCoupons: {
    type: Number,
    default: null
  },
  taxAmount: {
    type: Number,
    required: true
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['paid'],
    default: 'paid'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'paypal'],
    default: 'razorpay'
  }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;