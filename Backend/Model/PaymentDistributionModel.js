import mongoose from 'mongoose';

const paymentDistributionSchema = new mongoose.Schema({
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
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  adminCommission: {
    type: Number,
    required: true,
    min: 0
  },
  tutorAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionPercentage: {
    type: Number,
    default: 10, // 10% commission
    min: 0,
    max: 100
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'courses',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    tutorShare: {
      type: Number,
      required: true,
      min: 0
    },
    adminShare: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  distributedAt: {
    type: Date,
    default: null
  },
  adminWalletUpdated: {
    type: Boolean,
    default: false
  },
  tutorWalletUpdated: {
    type: Boolean,
    default: false
  },
  retryCount: {
    type: Number,
    default: 0,
    max: 5
  },
  lastRetryAt: {
    type: Date,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});


paymentDistributionSchema.index({ razorpayPaymentId: 1 });
paymentDistributionSchema.index({ status: 1 });
paymentDistributionSchema.index({ tutor: 1 });
paymentDistributionSchema.index({ createdAt: -1 });
paymentDistributionSchema.index({ status: 1, createdAt: 1 }); // For cron job queries


paymentDistributionSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.distributedAt = new Date();
  return this.save();
};

paymentDistributionSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  return this.save();
};

paymentDistributionSchema.methods.canRetry = function() {
  return this.retryCount < 5 && this.status === 'failed';
};

// Static methods
paymentDistributionSchema.statics.getPendingDistributions = function() {
  return this.find({
    status: { $in: ['pending', 'failed'] },
    retryCount: { $lt: 5 }
  }).populate('tutor', 'full_name email')
    .populate('user', 'full_name email')
    .populate('courses.course', 'title');
};

paymentDistributionSchema.statics.createDistribution = async function(orderData) {
  const commissionPercentage = 10; // 10% to admin
  const adminCommission = (orderData.totalAmount * commissionPercentage) / 100;
  const tutorAmount = orderData.totalAmount - adminCommission;
  
  const distribution = new this({
    orderId: orderData.orderId,
    razorpayOrderId: orderData.razorpayOrderId,
    razorpayPaymentId: orderData.razorpayPaymentId,
    totalAmount: orderData.totalAmount,
    adminCommission,
    tutorAmount,
    commissionPercentage,
    tutor: orderData.tutor,
    user: orderData.user,
    courses: orderData.courses.map(course => ({
      course: course.courseId,
      amount: course.amount,
      tutorShare: course.amount * (100 - commissionPercentage) / 100,
      adminShare: course.amount * commissionPercentage / 100
    }))
  });
  
  return distribution.save();
};

const PaymentDistribution = mongoose.model('PaymentDistribution', paymentDistributionSchema);
export default PaymentDistribution;