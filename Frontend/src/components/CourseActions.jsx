import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Trash2, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { addToCart, removeFromCart, moveToWishlist, getCart } from '../Redux/cartSlice';
import { addToWishlist, removeFromWishlist, moveToCart, getWishlist } from '../Redux/wishlistSlice';
import { useCurrentUser } from '../hooks/useCurrentUser';

const CourseActions = ({ courseId, className = "" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState({ cart: false, wishlist: false });
  
  const { items: cartItems } = useSelector(state => state.cart);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  const { user } = useCurrentUser();
  
  const isInCart = cartItems?.some(item => item.course._id === courseId);
  const isInWishlist = wishlistItems?.some(item => item.course._id === courseId);
  
  // Check if user has purchased this course (handle populated course objects)
  const isPurchased = user?.courses?.some(c => {
    const courseId_in_user = c.course?._id || c.course;
    return courseId_in_user?.toString() === courseId;
  });
  
  // Determine current page context
  const isCartPage = location.pathname.includes('/cart');
  const isWishlistPage = location.pathname.includes('/wishlist');

  const handleCartAction = async () => {
    setLoading(prev => ({ ...prev, cart: true }));
    try {
      if (isCartPage && isInCart) {
        // Remove from cart when on cart page
        await dispatch(removeFromCart(courseId)).unwrap();
        toast.success('Course removed from cart');
      } else if (isWishlistPage && !isInCart) {
        // Move to cart when on wishlist page
        await dispatch(moveToCart(courseId)).unwrap();
        // Refresh cart data to update state
        setTimeout(() => {
          dispatch(getCart());
        }, 100);
        toast.success('Course moved to cart');
      } else if (!isInCart) {
        // Add to cart on other pages
        await dispatch(addToCart(courseId)).unwrap();
        
        // If course was in wishlist, remove it
        if (isInWishlist) {
          await dispatch(removeFromWishlist(courseId)).unwrap();
        }
        
        toast.success('Course added to cart');
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(prev => ({ ...prev, cart: false }));
    }
  };

  const handleWishlistAction = async () => {
    // Don't allow adding to wishlist if course is in cart (except on cart page)
    if (isInCart && !isCartPage && !isInWishlist) {
      toast.info('Course is already in your cart. Remove from cart to add to wishlist.');
      return;
    }

    setLoading(prev => ({ ...prev, wishlist: true }));
    try {
      if (isWishlistPage && isInWishlist) {
        // Remove from wishlist when on wishlist page
        await dispatch(removeFromWishlist(courseId)).unwrap();
        toast.success('Course removed from wishlist');
      } else if (isCartPage && isInCart) {
        // Move to wishlist when on cart page
        await dispatch(moveToWishlist(courseId)).unwrap();
        // Refresh wishlist data to update state
        setTimeout(() => {
          dispatch(getWishlist());
        }, 100);
        toast.success('Course moved to wishlist');
      } else if (isInWishlist) {
        // Remove from wishlist on other pages
        await dispatch(removeFromWishlist(courseId)).unwrap();
        toast.success('Course removed from wishlist');
      } else if (!isInCart) {
        // Add to wishlist on other pages (only if not in cart)
        await dispatch(addToWishlist(courseId)).unwrap();
        toast.success('Course added to wishlist');
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(prev => ({ ...prev, wishlist: false }));
    }
  };

  // Determine button text and style based on context
  const getCartButtonConfig = () => {
    if (loading.cart) return { text: 'Processing...', icon: ShoppingCart, disabled: true };
    
    if (isCartPage && isInCart) {
      return { 
        text: 'Remove from Cart', 
        icon: Trash2, 
        disabled: false,
        className: 'bg-red-500 text-white hover:bg-red-600'
      };
    }
    
    if (isWishlistPage && !isInCart) {
      return { 
        text: 'Move to Cart', 
        icon: ArrowRightLeft, 
        disabled: false,
        className: 'bg-sky-500 text-white hover:bg-sky-600'
      };
    }
    
    if (isInCart) {
      return { 
        text: 'In Cart', 
        icon: ShoppingCart, 
        disabled: true,
        className: 'bg-gray-100 text-gray-500 cursor-not-allowed'
      };
    }
    
    return { 
      text: 'Add to Cart', 
      icon: ShoppingCart, 
      disabled: false,
      className: 'bg-sky-500 text-white hover:bg-sky-600'
    };
  };

  const getWishlistButtonConfig = () => {
    if (loading.wishlist) return { disabled: true };
    
    if (isWishlistPage && isInWishlist) {
      return {
        className: 'border-red-500 bg-red-500 text-white',
        title: 'Remove from Wishlist',
        icon: Trash2
      };
    }
    
    if (isCartPage && isInCart) {
      return {
        className: 'border-sky-500 bg-sky-500 text-white',
        title: 'Move to Wishlist',
        icon: ArrowRightLeft
      };
    }
    
    if (isInWishlist) {
      return {
        className: 'border-red-500 bg-red-500 text-white',
        title: 'Remove from Wishlist',
        icon: Heart
      };
    }
    
    // If course is in cart, disable wishlist button on other pages
    if (isInCart && !isCartPage) {
      return {
        className: 'border-gray-300 text-gray-400 cursor-not-allowed',
        title: 'Already in Cart',
        icon: Heart,
        disabled: true
      };
    }
    
    return {
      className: 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500',
      title: 'Add to Wishlist',
      icon: Heart
    };
  };

  const cartConfig = getCartButtonConfig();
  const wishlistConfig = getWishlistButtonConfig();
  const WishlistIcon = wishlistConfig.icon || Heart;

  // If course is purchased, show different actions
  if (isPurchased) {
    return (
      <div className={`flex gap-3 ${className}`}>
        <button
          onClick={() => navigate(`/user/learn/${courseId}`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          Go to Course
        </button>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      <button
        onClick={handleCartAction}
        disabled={cartConfig.disabled || loading.cart}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          cartConfig.className || 'bg-sky-500 text-white hover:bg-sky-600'
        }`}
      >
        <cartConfig.icon className="w-5 h-5" />
        {cartConfig.text}
      </button>
      
      <button
        onClick={handleWishlistAction}
        disabled={loading.wishlist || wishlistConfig.disabled}
        className={`p-3 rounded-lg border-2 transition-colors disabled:opacity-50 ${wishlistConfig.className}`}
        title={wishlistConfig.title}
      >
        <WishlistIcon className={`w-5 h-5 ${isInWishlist && !isWishlistPage ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
};

export default CourseActions;