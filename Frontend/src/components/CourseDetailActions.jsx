import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, MessageCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { addToCart } from '../Redux/cartSlice';
import { addToWishlist, removeFromWishlist } from '../Redux/wishlistSlice';
import { createOrGetChat } from '../Redux/chatSlice';

const CourseDetailActions = ({ courseId, course, isPurchased: propIsPurchased, className = "" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState({ cart: false, wishlist: false, chat: false });
  
  const { items: cartItems } = useSelector(state => state.cart);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  const { user } = useSelector(state => state.currentUser);
  
  const isInCart = cartItems?.some(item => item.course._id === courseId);
  const isInWishlist = wishlistItems?.some(item => item.course._id === courseId);
  
  // Use prop if provided, otherwise check user courses (handle populated course objects)
  const isPurchased = propIsPurchased !== undefined 
    ? propIsPurchased 
    : user?.courses?.some(c => {
        const courseId_in_user = c.course?._id || c.course;
        return courseId_in_user?.toString() === courseId;
      });
  
  const tutorId = course?.tutor?._id || course?.tutor;
  const handleAddToCart = async () => {
    if (isInCart) return;
    
    setLoading(prev => ({ ...prev, cart: true }));
    try {
      await dispatch(addToCart(courseId)).unwrap();
      toast.success('Course added to cart');
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(prev => ({ ...prev, cart: false }));
    }
  };

  const handleWishlistToggle = async () => {
    setLoading(prev => ({ ...prev, wishlist: true }));
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(courseId)).unwrap();
        toast.success('Course removed from wishlist');
      } else {
        await dispatch(addToWishlist(courseId)).unwrap();
        toast.success('Course added to wishlist');
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(prev => ({ ...prev, wishlist: false }));
    }
  };

  const handleChatWithTutor = async () => {
    if (!isPurchased || !tutorId) return;
    
    setLoading(prev => ({ ...prev, chat: true }));
    try {
      await dispatch(createOrGetChat({ tutorId, courseId })).unwrap();
      navigate('/user/chat');
    } catch (error) {
      toast.error(error || 'Failed to start chat');
    } finally {
      setLoading(prev => ({ ...prev, chat: false }));
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      {!isPurchased ? (
        <>
          <button
            onClick={handleAddToCart}
            disabled={isInCart || loading.cart}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
              isInCart
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {loading.cart ? 'Adding...' : isInCart ? 'In Cart' : 'Add to Cart'}
          </button>
          
          <button
            onClick={handleWishlistToggle}
            disabled={loading.wishlist}
            className={`p-3 rounded-lg border-2 transition-colors disabled:opacity-50 ${
              isInWishlist
                ? 'border-red-500 bg-red-500 text-white'
                : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500'
            }`}
            title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => navigate(`/user/learn/${courseId}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Go to Course
          </button>
          
          <button
            onClick={handleChatWithTutor}
            disabled={loading.chat || !tutorId}
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 font-medium transition-colors"
            title="Chat with Tutor"
          >
            <MessageCircle className="w-5 h-5" />
            {loading.chat ? 'Starting...' : 'Chat'}
          </button>
        </>
      )}
    </div>
  );
};

export default CourseDetailActions;