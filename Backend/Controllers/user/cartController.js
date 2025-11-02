import Cart from '../../Model/CartModel.js';
import Wishlist from '../../Model/WishlistModel.js';
import { Course } from '../../Model/CourseModel.js';
import User from '../../Model/usermodel.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.course',
        select: 'title description price offer_percentage course_thumbnail average_rating total_reviews lessons listed isActive isBanned unlistedByAdmin',
        populate: {
          path: 'tutor',
          select: 'full_name'
        }
      });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    // Calculate totals for available items only
    const availableItems = cart.items.filter(item => {
      const course = item.course;
      return course && course.listed && course.isActive && !course.isBanned;
    });

    const totalAmount = availableItems.reduce((total, item) => {
      const course = item.course;
      const discountedPrice = course.price - (course.price * (course.offer_percentage || 0) / 100);
      return total + discountedPrice;
    }, 0);

    const totalItems = availableItems.length;

    // Update cart with calculated values
    cart.totalAmount = totalAmount;
    cart.totalItems = totalItems;

    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
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

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already in cart
    const existingItem = cart.items.find(item => item.course.toString() === courseId);
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Course already in cart'
      });
    }

    // Remove from wishlist if it exists there
    const wishlist = await Wishlist.findOne({ user: userId });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(item => item.course.toString() !== courseId);
      await wishlist.save();
    }

    // Add item to cart
    cart.items.push({ course: courseId });
    await cart.save();

    // Populate and return updated cart
    await cart.populate({
      path: 'items.course',
      populate: {
        path: 'tutor',
        select: 'full_name'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course added to cart',
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(item => item.course.toString() !== courseId);
    await cart.save();

    await cart.populate({
      path: 'items.course',
      populate: {
        path: 'tutor',
        select: 'full_name'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Course removed from cart',
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from cart',
      error: error.message
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    cart.totalAmount = 0;
    cart.totalItems = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};

// Move item from cart to wishlist
export const moveToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;

    // Remove from cart
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = cart.items.filter(item => item.course.toString() !== courseId);
      await cart.save();
    }

    // Add to wishlist (import Wishlist model)
    const Wishlist = (await import('../../Model/WishlistModel.js')).default;
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, items: [] });
    }

    const existingItem = wishlist.items.find(item => item.course.toString() === courseId);
    if (!existingItem) {
      wishlist.items.push({ course: courseId });
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Course moved to wishlist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error moving to wishlist',
      error: error.message
    });
  }
};
// Clean up unavailable courses from all carts
export const cleanupUnavailableCourses = async (req, res) => {
  try {
    // Find all carts with items
    const carts = await Cart.find({ 'items.0': { $exists: true } })
      .populate('items.course');

    let totalCleaned = 0;

    for (const cart of carts) {
      const originalLength = cart.items.length;
      
      // Filter out unavailable courses
      cart.items = cart.items.filter(item => {
        const course = item.course;
        return course && course.listed && course.isActive && !course.isBanned;
      });

      if (cart.items.length !== originalLength) {
        // Recalculate totals
        const totalAmount = cart.items.reduce((total, item) => {
          const course = item.course;
          const discountedPrice = course.price - (course.price * (course.offer_percentage || 0) / 100);
          return total + discountedPrice;
        }, 0);

        cart.totalAmount = totalAmount;
        cart.totalItems = cart.items.length;
        
        await cart.save();
        totalCleaned += (originalLength - cart.items.length);
      }
    }

    res.status(200).json({
      success: true,
      message: `Cleaned up ${totalCleaned} unavailable courses from carts`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cleaning up carts',
      error: error.message
    });
  }
};

// Remove unavailable courses from user's cart
export const removeUnavailableFromCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId })
      .populate('items.course');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const originalLength = cart.items.length;
    
    // Filter out unavailable courses
    cart.items = cart.items.filter(item => {
      const course = item.course;
      return course && course.listed && course.isActive && !course.isBanned;
    });

    // Recalculate totals
    const totalAmount = cart.items.reduce((total, item) => {
      const course = item.course;
      const discountedPrice = course.price - (course.price * (course.offer_percentage || 0) / 100);
      return total + discountedPrice;
    }, 0);

    cart.totalAmount = totalAmount;
    cart.totalItems = cart.items.length;
    
    await cart.save();

    const removedCount = originalLength - cart.items.length;

    res.status(200).json({
      success: true,
      message: removedCount > 0 ? `Removed ${removedCount} unavailable course${removedCount > 1 ? 's' : ''} from cart` : 'No unavailable courses found',
      cart,
      removedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing unavailable courses',
      error: error.message
    });
  }
};