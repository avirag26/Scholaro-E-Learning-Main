import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import UserSidebar from '../../components/UserSidebar';
import { getCart, removeFromCart, clearCart, moveToWishlist } from '../../Redux/cartSlice';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount, totalItems, loading, error } = useSelector(state => state.cart);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(getCart());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleRemoveItem = async (courseId) => {
    try {
      await dispatch(removeFromCart(courseId)).unwrap();
      toast.success('Course removed from cart');
    } catch (error) {
      toast.error(error.message || 'Failed to remove course');
    }
  };

  const handleMoveToWishlist = async (courseId) => {
    try {
      await dispatch(moveToWishlist(courseId)).unwrap();
      // Refresh cart data after moving to wishlist
      dispatch(getCart());
      toast.success('Course moved to wishlist');
    } catch (error) {
      toast.error(error.message || 'Failed to move course');
    }
  };

  const handleClearCart = async () => {
    try {
      await dispatch(clearCart()).unwrap();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error(error.message || 'Failed to clear cart');
    }
  };

  const calculateDiscountedPrice = (price, offerPercentage) => {
    if (!offerPercentage) return price;
    return price - (price * offerPercentage / 100);
  };

  const calculateTotalSavings = () => {
    return items.reduce((total, item) => {
      const originalPrice = item.course.price;
      const discountedPrice = calculateDiscountedPrice(originalPrice, item.course.offer_percentage);
      return total + (originalPrice - discountedPrice);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/user/home" className="text-gray-700 hover:text-sky-500">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">Shopping Cart</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex gap-8">
          {/* Common Sidebar */}
          <UserSidebar activeSection="cart" />

          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">{totalItems} Course{totalItems !== 1 ? 's' : ''} in cart</span>
                    {items.length > 0 && (
                      <button
                        onClick={handleClearCart}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Looks like you haven't added any courses yet.</p>
                  <Link
                    to="/user/courses"
                    className="inline-flex items-center px-6 py-3 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const course = item.course;
                    const discountedPrice = calculateDiscountedPrice(course.price, course.offer_percentage);
                    
                    return (
                      <div key={item._id} className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={course.course_thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                {course.title}
                              </h3>
                              <button
                                onClick={() => handleRemoveItem(course._id)}
                                className="text-gray-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                            
                            <p className="text-gray-600 mb-2">By {course.tutor?.full_name}</p>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center">
                                <span className="text-yellow-400">★</span>
                                <span className="text-sm text-gray-600 ml-1">
                                  {course.average_rating?.toFixed(1) || 'No rating'} ({course.total_reviews || 0} reviews)
                                </span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">{course.lessons?.length || 0} lessons</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-gray-900">
                                  ₹{discountedPrice.toFixed(2)}
                                </span>
                                {course.offer_percentage > 0 && (
                                  <span className="text-sm text-gray-500 line-through">
                                    ₹{course.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleMoveToWishlist(course._id)}
                                  className="flex items-center gap-1 px-3 py-1 text-sm text-sky-600 hover:text-sky-700 border border-sky-200 rounded-md hover:bg-sky-50"
                                >
                                  <Heart className="h-4 w-4" />
                                  Save for later
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-medium">₹{(totalAmount + calculateTotalSavings()).toFixed(2)}</span>
                  </div>
                  
                  {calculateTotalSavings() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{calculateTotalSavings().toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (3%)</span>
                    <span className="font-medium">₹{(totalAmount * 0.03).toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>₹{(totalAmount + (totalAmount * 0.03)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/user/checkout')}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mb-3"
                >
                  Proceed to Checkout
                </button>
                
                <Link
                  to="/user/courses"
                  className="block w-full text-center py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}