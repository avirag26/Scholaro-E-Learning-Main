
import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  usedAt: { type: Date, default: Date.now },
  discountApplied: { type: Number, required: true }
});

const couponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    maxlength: 500
  },
  discountType: { 
    type: String, 
    enum: ["percentage", "fixed"], 
    required: true 
  },
  discountValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  maxDiscountAmount: { 
    type: Number, 
    default: null // For percentage discounts, max discount cap
  },
  minPurchaseAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  expiryDate: { 
    type: Date, 
    required: true 
  },
  tutorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Tutor", 
    required: true 
  },
  // Usage restrictions
  usageLimit: { 
    type: Number, 
    default: null // null means unlimited
  },
  usagePerUser: { 
    type: Number, 
    default: 1 // How many times one user can use this coupon
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  // Course restrictions
  applicableCourses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "courses" 
  }], // Empty array means applicable to all tutor's courses
  excludedCourses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "courses" 
  }],
  // Status
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // Usage tracking
  usageHistory: [couponUsageSchema]
}, { 
  timestamps: true 
});

// Indexes for better performance
couponSchema.index({ code: 1 });
couponSchema.index({ tutorId: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ isActive: 1 });

// Virtual for checking if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual for checking if coupon is valid (not expired and active)
couponSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired && new Date() >= this.startDate;
});

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (!this.usageLimit) return null; // Unlimited
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Method to check if user can use this coupon
couponSchema.methods.canUserUse = function(userId) {
  const userUsageCount = this.usageHistory.filter(
    usage => usage.userId.toString() === userId.toString()
  ).length;
  return userUsageCount < this.usagePerUser;
};

// Method to check if coupon is applicable to courses
couponSchema.methods.isApplicableToCourses = function(courseIds) {
  // If no specific courses defined, applicable to all tutor's courses
  if (this.applicableCourses.length === 0) {
    // Check if any courses are excluded
    if (this.excludedCourses.length > 0) {
      return !courseIds.some(courseId => 
        this.excludedCourses.some(excluded => 
          excluded.toString() === courseId.toString()
        )
      );
    }
    return true;
  }
  
  // Check if at least one course is in applicable list
  return courseIds.some(courseId => 
    this.applicableCourses.some(applicable => 
      applicable.toString() === courseId.toString()
    )
  );
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(amount) {
  if (this.discountType === 'percentage') {
    let discount = (amount * this.discountValue) / 100;
    if (this.maxDiscountAmount) {
      discount = Math.min(discount, this.maxDiscountAmount);
    }
    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  } else {
    return Math.min(this.discountValue, amount);
  }
};

// Method to use coupon
couponSchema.methods.useCoupon = function(userId, orderId, discountApplied) {
  this.usedCount += 1;
  this.usageHistory.push({
    userId,
    orderId,
    discountApplied
  });
  return this.save();
};

// Static method to find valid coupon
couponSchema.statics.findValidCoupon = function(code, tutorId = null) {
  const query = {
    code: code.toUpperCase(),
    isActive: true,
    startDate: { $lte: new Date() },
    expiryDate: { $gt: new Date() }
  };
  
  if (tutorId) {
    query.tutorId = tutorId;
  }
  
  return this.findOne(query);
};

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;