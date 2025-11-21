import Coupon from "../../Model/CouponModel.js";
import Tutor from "../../Model/TutorModel.js";
import { Course } from "../../Model/CourseModel.js";
import User from "../../Model/usermodel.js";
import { STATUS_CODES } from "../../constants/constants.js";

// Create a new coupon (Tutor only)
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minPurchaseAmount,
      startDate,
      expiryDate,
      usageLimit,
      usagePerUser,
      applicableCourses,
      excludedCourses
    } = req.body;

    // Get tutor ID from authenticated user
    const tutorId = req.tutor?._id || req.user?._id;
    
    if (!tutorId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Validate tutor exists
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Tutor not found"
      });
    }

    // Validate required fields
    if (!code || !title || !discountType || !discountValue || !expiryDate) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate discount value
    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Percentage discount must be between 1 and 100"
      });
    }

    if (discountType === 'fixed' && discountValue <= 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Fixed discount must be greater than 0"
      });
    }

    // Validate dates
    const now = new Date();
    const expiry = new Date(expiryDate);
    const start = startDate ? new Date(startDate) : now;

    if (expiry <= now) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Expiry date must be in the future"
      });
    }

    if (start >= expiry) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Start date must be before expiry date"
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ 
      code: code.toUpperCase().trim() 
    });
    
    if (existingCoupon) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Coupon code already exists"
      });
    }

    // Validate courses belong to tutor
    if (applicableCourses && applicableCourses.length > 0) {
      const courses = await Course.find({
        _id: { $in: applicableCourses },
        tutor: tutorId
      });
      
      if (courses.length !== applicableCourses.length) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: "Some courses don't belong to you"
        });
      }
    }

    if (excludedCourses && excludedCourses.length > 0) {
      const courses = await Course.find({
        _id: { $in: excludedCourses },
        tutor: tutorId
      });
      
      if (courses.length !== excludedCourses.length) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: "Some excluded courses don't belong to you"
        });
      }
    }

    // Create coupon
    const coupon = new Coupon({
      code: code.toUpperCase().trim(),
      title: title.trim(),
      description: description?.trim(),
      discountType,
      discountValue,
      maxDiscountAmount: discountType === 'percentage' ? maxDiscountAmount : null,
      minPurchaseAmount: minPurchaseAmount || 0,
      startDate: start,
      expiryDate: expiry,
      tutorId,
      usageLimit: usageLimit || null,
      usagePerUser: usagePerUser || 1,
      applicableCourses: applicableCourses || [],
      excludedCourses: excludedCourses || []
    });

    await coupon.save();

    // Populate tutor info for response
    await coupon.populate('tutorId', 'full_name email');

    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: "Coupon created successfully",
      coupon
    });

  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error creating coupon",
      error: error.message
    });
  }
};

// Get tutor's coupons
export const getTutorCoupons = async (req, res) => {
  try {
    const tutorId = req.tutor?._id || req.user?._id;
    const { page = 1, limit = 10, status = 'all' } = req.query;

    if (!tutorId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required"
      });
    }

    let query = { tutorId };

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
      query.expiryDate = { $gt: new Date() };
    } else if (status === 'expired') {
      query.expiryDate = { $lte: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (page - 1) * limit;

    const coupons = await Coupon.find(query)
      .populate('applicableCourses', 'title')
      .populate('excludedCourses', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCoupons = await Coupon.countDocuments(query);

    res.status(STATUS_CODES.OK).json({
      success: true,
      coupons,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCoupons / limit),
        totalCoupons,
        hasNext: page < Math.ceil(totalCoupons / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching coupons",
      error: error.message
    });
  }
};

// Validate and apply coupon (User) - Updated for multi-tutor support
export const validateCoupon = async (req, res) => {
  try {
    const { code, courseIds, totalAmount, tutorId } = req.body;
    const userId = req.user._id;

    if (!code || !courseIds || !totalAmount) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Find coupon - if tutorId provided, validate for specific tutor
    const coupon = await Coupon.findValidCoupon(code, tutorId);
    
    if (!coupon) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Invalid or expired coupon code"
      });
    }

    // For multi-tutor carts, ensure coupon belongs to the specified tutor
    if (tutorId && coupon.tutorId.toString() !== tutorId.toString()) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "This coupon is not valid for the selected tutor's courses"
      });
    }

    // Check if user can use this coupon
    if (!coupon.canUserUse(userId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: `You have already used this coupon ${coupon.usagePerUser} time(s)`
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Coupon usage limit exceeded"
      });
    }

    // Check minimum purchase amount
    if (totalAmount < coupon.minPurchaseAmount) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: `Minimum purchase amount is ₹${coupon.minPurchaseAmount}`
      });
    }

    // Check if coupon is applicable to the courses
    if (!coupon.isApplicableToCourses(courseIds)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Coupon is not applicable to selected courses"
      });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(totalAmount);
    const finalAmount = totalAmount - discountAmount;

    // Get tutor name for response
    const tutor = await Tutor.findById(coupon.tutorId).select('full_name');

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Coupon is valid",
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        tutorId: coupon.tutorId,
        tutorName: tutor?.full_name || 'Unknown Tutor'
      },
      discount: {
        amount: discountAmount,
        originalAmount: totalAmount,
        finalAmount: Math.max(0, finalAmount)
      }
    });

  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error validating coupon",
      error: error.message
    });
  }
};

// Update coupon (Tutor only)
export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const tutorId = req.tutor?._id || req.user?._id;
    const updates = req.body;

    if (!tutorId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required"
      });
    }

    const coupon = await Coupon.findOne({ _id: couponId, tutorId });
    
    if (!coupon) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Coupon not found"
      });
    }

    // Don't allow updating if coupon has been used
    if (coupon.usedCount > 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Cannot update coupon that has been used"
      });
    }

    // Validate updates
    if (updates.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: updates.code.toUpperCase().trim(),
        _id: { $ne: couponId }
      });
      
      if (existingCoupon) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: "Coupon code already exists"
        });
      }
      updates.code = updates.code.toUpperCase().trim();
    }

    if (updates.discountType === 'percentage' && updates.discountValue) {
      if (updates.discountValue <= 0 || updates.discountValue > 100) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: "Percentage discount must be between 1 and 100"
        });
      }
    }

    // Update coupon
    Object.assign(coupon, updates);
    await coupon.save();

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Coupon updated successfully",
      coupon
    });

  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error updating coupon",
      error: error.message
    });
  }
};

// Delete coupon (Tutor only)
export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const tutorId = req.tutor?._id || req.user?._id;

    if (!tutorId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required"
      });
    }

    const coupon = await Coupon.findOne({ _id: couponId, tutorId });
    
    if (!coupon) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Coupon not found"
      });
    }

    // Don't allow deleting if coupon has been used
    if (coupon.usedCount > 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Cannot delete coupon that has been used. You can deactivate it instead."
      });
    }

    await Coupon.findByIdAndDelete(couponId);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: "Coupon deleted successfully"
    });

  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error deleting coupon",
      error: error.message
    });
  }
};

// Toggle coupon status (Tutor only)
export const toggleCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.params;
    const tutorId = req.tutor?._id || req.user?._id;

    if (!tutorId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required"
      });
    }

    const coupon = await Coupon.findOne({ _id: couponId, tutorId });
    
    if (!coupon) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Coupon not found"
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      coupon
    });

  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error updating coupon status",
      error: error.message
    });
  }
};

// Get coupon analytics (Tutor only)
export const getCouponAnalytics = async (req, res) => {
  try {
    const tutorId = req.tutor?._id || req.user?._id;

    if (!tutorId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required"
      });
    }

    const analytics = await Coupon.aggregate([
      { $match: { tutorId: tutorId } },
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$isActive', true] },
                  { $gt: ['$expiryDate', new Date()] }
                ]},
                1,
                0
              ]
            }
          },
          totalUsage: { $sum: '$usedCount' },
          totalDiscountGiven: {
            $sum: {
              $reduce: {
                input: '$usageHistory',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.discountApplied'] }
              }
            }
          }
        }
      }
    ]);

    const result = analytics[0] || {
      totalCoupons: 0,
      activeCoupons: 0,
      totalUsage: 0,
      totalDiscountGiven: 0
    };

    res.status(STATUS_CODES.OK).json({
      success: true,
      analytics: result
    });

  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message
    });
  }
};

// Get public coupons for users (grouped by tutor)
export const getPublicCoupons = async (req, res) => {
  try {
    const { tutorId } = req.query;

    // Build query for active, non-expired coupons
    const query = {
      isActive: true,
      startDate: { $lte: new Date() },
      expiryDate: { $gt: new Date() }
    };

    // If tutorId provided, filter by specific tutor
    if (tutorId) {
      query.tutorId = tutorId;
    }

    // Also check if coupon still has usage left
    const coupons = await Coupon.find(query)
      .populate('tutorId', 'full_name profile_image')
      .populate('applicableCourses', 'title price')
      .select('code title description discountType discountValue maxDiscountAmount minPurchaseAmount expiryDate usageLimit usedCount usagePerUser applicableCourses excludedCourses tutorId')
      .sort({ createdAt: -1 });

    // Filter out coupons that have reached usage limit
    const availableCoupons = coupons.filter(coupon => {
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return false;
      }
      return true;
    });

    // Group coupons by tutor
    const couponsByTutor = {};
    availableCoupons.forEach(coupon => {
      const tutorId = coupon.tutorId._id.toString();
      if (!couponsByTutor[tutorId]) {
        couponsByTutor[tutorId] = {
          tutor: {
            _id: coupon.tutorId._id,
            name: coupon.tutorId.full_name,
            profileImage: coupon.tutorId.profile_image
          },
          coupons: []
        };
      }
      
      // Add coupon with calculated remaining uses
      const remainingUses = coupon.usageLimit ? Math.max(0, coupon.usageLimit - coupon.usedCount) : null;
      
      couponsByTutor[tutorId].coupons.push({
        _id: coupon._id,
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minPurchaseAmount: coupon.minPurchaseAmount,
        expiryDate: coupon.expiryDate,
        remainingUses,
        isUnlimited: !coupon.usageLimit,
        applicableCourses: coupon.applicableCourses,
        hasRestrictions: coupon.applicableCourses.length > 0 || coupon.excludedCourses.length > 0
      });
    });

    res.status(STATUS_CODES.OK).json({
      success: true,
      couponsByTutor,
      totalCoupons: availableCoupons.length
    });

  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching public coupons",
      error: error.message
    });
  }
};

// Legacy function for backward compatibility
export const addCoupon = createCoupon;
