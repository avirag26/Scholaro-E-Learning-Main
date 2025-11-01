import Wishlist from '../Model/WishlistModel.js';
import { Course } from '../Model/CourseModel.js';
import User from '../Model/usermodel.js';

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let wishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: 'items.course',
        populate: {
          path: 'tutor',
          select: 'full_name'
        }
      });

    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, items: [] });
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      error: error.message
    });
  }
};

// Add item to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;

    // Check if course exists and is active
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or inactive'
      });
    }

    // Check if user already enrolled in this course
    const user = await User.findById(userId);
    const isEnrolled = user.courses.some(c => c.course.toString() === courseId);
    if (isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, items: [] });
    }

    // Check if item already in wishlist
    const existingItem = wishlist.items.find(item => item.course.toString() === courseId);
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Course already in wishlist'
      });
    }

    // Add item to wishlist
    wishlist.items.push({ course: courseId });
    await wishlist.save();

    // Populate and return updated wishlist
    await wishlist.populate({
      path: 'items.course',
      populate: {
        path: 'tutor',
        select: 'full_name'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course added to wishlist',
      wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist',
      error: error.message
    });
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    wishlist.items = wishlist.items.filter(item => item.course.toString() !== courseId);
    await wishlist.save();

    await wishlist.populate({
      path: 'items.course',
      populate: {
        path: 'tutor',
        select: 'full_name'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course removed from wishlist',
      wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist',
      error: error.message
    });
  }
};

// Move item from wishlist to cart
export const moveToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(item => item.course.toString() !== courseId);
      await wishlist.save();
    }

    // Add to cart (import Cart model)
    const Cart = (await import('../Model/CartModel.js')).default;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.course.toString() === courseId);
    if (!existingItem) {
      cart.items.push({ course: courseId });
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Course moved to cart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error moving to cart',
      error: error.message
    });
  }
};

// Clear entire wishlist
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    wishlist.items = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing wishlist',
      error: error.message
    });
  }
};