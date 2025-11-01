import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { addToCart } from '../Redux/cartSlice';
import { addToWishlist, removeFromWishlist } from '../Redux/wishlistSlice';

const CourseActions = ({ courseId, className = "" }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState({ cart: false, wishlist: false });
  
  const { items: cartItems } = useSelector(state => state.cart);
  const { items: wishlistItems } = useSelector(state => state.wishlist);
  
  const isInCart = cartItems?.some(item => item.course._id === courseId);
  const isInWishlist = wishlistItems?.some(item => item.course._id === courseId);

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

  return (
    <div className={`flex gap-3 ${className}`}>
      <button
        onClick={handleAddToCart}
        disabled={isInCart || loading.cart}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
          isInCart
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50'
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
    </div>
  );
};

export default CourseActions;