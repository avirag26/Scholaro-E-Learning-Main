import User from "../../Model/usermodel.js";
import Order from "../../Model/OrderModel.js";
import { sendOtpToEmail, verifyEmailOtp, sendOtpWithData, verifyOtpWithData } from '../../utils/otpService.js';
import { generateSignedVideoUrl, extractPublicIdFromUrl, generateUltraSecureVideoUrl } from '../../config/cloudinary.js';

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        wallet: user.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user._id;

    // Validate name if provided
    if (name) {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({ message: "Name must be between 2 and 50 characters" });
      }
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({ message: "Name can only contain letters and spaces" });
      }
      if (/\d/.test(name)) {
        return res.status(400).json({ message: "Name cannot contain numbers" });
      }
      if (name.includes('_')) {
        return res.status(400).json({ message: "Name cannot contain underscores" });
      }
    }

    // Validate phone if provided
    if (phone) {
      if (!/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ message: "Please enter a valid 10-digit Indian phone number starting with 6-9" });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.full_name = name.trim();
    if (phone) user.phone = phone;
    await user.save();
    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const uploadProfilePhoto = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.user._id;
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }
    try {
      new URL(imageUrl);
    } catch (error) {
      return res.status(400).json({ message: "Invalid image URL format" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.profileImage = imageUrl;
    await user.save();
    res.status(200).json({
      message: "Profile photo updated successfully",
      profileImage: user.profileImage
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while uploading profile photo" });
  }
};

const sendPasswordChangeOtp = async (req, res) => {
  try {
    const user = req.user;
    await sendOtpToEmail(user.email, 'password-change');
    res.status(200).json({
      message: "OTP sent to your email address"
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

const changePasswordWithOtp = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const user = req.user;
    if (!otp || !newPassword) {
      return res.status(400).json({
        message: "OTP and new password are required"
      });
    }
    const otpResult = await verifyEmailOtp(user.email, otp, 'password-change');
    if (!otpResult.success) {
      return res.status(400).json({
        message: otpResult.message
      });
    }
    const userDoc = await User.findById(user._id);
    userDoc.password = newPassword;
    await userDoc.save();
    res.status(200).json({
      message: "Password changed successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

const sendEmailChangeOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user._id;
    if (!newEmail) {
      return res.status(400).json({
        message: "New email is required"
      });
    }
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "Email is already taken by another user"
      });
    }
    const otpResult = await sendOtpWithData(newEmail, 'email-change', {
      userId: userId.toString(),
      newEmail: newEmail,
      userType: 'user'
    });
    if (!otpResult.success) {
      return res.status(500).json({
        message: otpResult.message
      });
    }
    res.status(200).json({
      message: "OTP sent to your new email address"
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

const verifyEmailChangeOtp = async (req, res) => {
  try {
    const { otp, newEmail } = req.body;
    const userId = req.user._id;
    if (!otp || !newEmail) {
      return res.status(400).json({
        message: "OTP and new email are required"
      });
    }
    const verifyResult = await verifyOtpWithData(newEmail, otp, 'email-change');
    if (!verifyResult.success) {
      return res.status(400).json({
        message: verifyResult.message
      });
    }
    if (verifyResult.data.userId !== userId.toString()) {
      return res.status(400).json({
        message: "Invalid OTP for this user"
      });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { email: newEmail },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    res.status(200).json({
      message: "Email changed successfully",
      user: {
        _id: user._id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

const getMyCourses = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get orders with payment completed
    const orders = await Order.find({
      user: userId,
      $or: [
        { status: 'completed' },
        { status: 'paid' },
        { status: 'success' },
        { razorpayPaymentId: { $exists: true, $ne: null } }
      ]
    }).populate({
      path: 'items.course',
      populate: [
        {
          path: 'tutor',
          select: 'full_name'
        },
        {
          path: 'category',
          select: 'name'
        }
      ]
    });

    // Extract all courses from orders - all purchased courses are considered enrolled
    const enrolledCourses = [];

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.course) {
          // Calculate progress (mock data for now - you can implement actual lesson completion tracking)
          const totalLessons = item.course.lessons?.length || 0;
          // Generate more realistic progress based on course ID for consistency
          const courseIdNum = parseInt(item.course._id.toString().slice(-2), 16) || 1;
          const progressSeed = (courseIdNum * 7) % 101; // Generate consistent progress between 0-100
          const progress = totalLessons > 0 ? Math.min(100, progressSeed) : 0;

          const courseData = {
            _id: item.course._id,
            title: item.course.title,
            course_thumbnail: item.course.course_thumbnail,
            tutor: item.course.tutor,
            average_rating: item.course.average_rating || 0,
            total_ratings: item.course.total_ratings || 0,
            lessons: item.course.lessons || [],
            duration: item.course.duration,
            category: item.course.category?.name || 'Uncategorized',
            progress: progress,
            enrolledAt: order.createdAt
          };

          enrolledCourses.push(courseData);
        }
      });
    });

    res.status(200).json({
      success: true,
      enrolledCourses,
      completedCourses: [] // For now, no completed courses logic
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses"
    });
  }
};

const getCourseForLearning = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    // Check if user has purchased this course
    const order = await Order.findOne({
      user: userId,
      'items.course': courseId,
      $or: [
        { status: 'completed' },
        { status: 'paid' },
        { status: 'success' },
        { razorpayPaymentId: { $exists: true, $ne: null } }
      ]
    }).populate({
      path: 'items.course',
      populate: [
        {
          path: 'tutor',
          select: 'full_name'
        },
        {
          path: 'lessons'
        }
      ]
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this course. Please purchase it first."
      });
    }

    // Find the specific course from the order
    const courseItem = order.items.find(item => item.course._id.toString() === courseId);

    if (!courseItem) {
      return res.status(404).json({
        success: false,
        message: "Course not found in your purchases"
      });
    }

    const course = courseItem.course;

    // Get real lessons from the course, sorted by order
    let lessons = course.lessons || [];

    // Sort lessons by order field
    lessons = lessons.sort((a, b) => (a.order || 0) - (b.order || 0));

    // If no lessons exist, return empty array with message
    if (lessons.length === 0) {
      return res.status(200).json({
        success: true,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          tutor: course.tutor,
          course_thumbnail: course.course_thumbnail
        },
        lessons: [],
        message: 'No lessons available for this course yet. Please contact the instructor.'
      });
    }

    res.status(200).json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        tutor: course.tutor,
        course_thumbnail: course.course_thumbnail
      },
      lessons: lessons.map(lesson => {
        let videoUrl = lesson.videoUrl;

        // Generate secure signed URL for video if it exists and Cloudinary is configured
        if (lesson.videoUrl && process.env.CLOUDINARY_API_SECRET) {
          try {
            const publicId = extractPublicIdFromUrl(lesson.videoUrl);
            if (publicId) {
              // Use regular signed URL with user binding and short expiration
              videoUrl = generateSignedVideoUrl(publicId, {
                expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
              }, userId.toString());
            }
          } catch (error) {
            console.error('Error generating signed URL for lesson:', lesson._id, error);
            // Keep original URL if signing fails
          }
        }

        return {
          _id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          videoUrl: videoUrl,
          thumbnailUrl: lesson.thumbnailUrl,
          pdfUrl: lesson.pdfUrl,
          order: lesson.order,
          isPublished: lesson.isPublished
        };
      })
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching course data"
    });
  }
};

export {
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
  getMyCourses,
  getCourseForLearning
};