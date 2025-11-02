import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import UserSidebar from '../../components/UserSidebar';
import { getCart, removeFromCart, clearCart, moveToWishlist, removeUnavailableFromCart } from '../../Redux/cartSlice';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalItems, loading, error } = useSelector(state => state.cart);
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

  const handleRemoveUnavailable = async () => {
    try {
      const result = await dispatch(removeUnavailableFromCart()).unwrap();
      if (result.removedCount > 0) {
        toast.success(result.message);
      } else {
        toast.info('No unavailable courses found in cart');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to remove unavailable courses');
    }
  };

  const calculateDiscountedPrice = (price, offerPercentage) => {
    if (!offerPercentage) return price;
    return price - (price * offerPercentage / 100);
  };

  const calculateTotalSavings = () => {
    return items.reduce((total, item) => {
      const course = item.course;
      const isUnavailable = !course.listed || !course.isActive || course.isBanned;
      if (isUnavailable) return total;
      
      const originalPrice = course.price;
      const discountedPrice = calculateDiscountedPrice(originalPrice, course.offer_percentage);
      return total + (originalPrice - discountedPrice);
    }, 0);
  };

  const getAvailableItems = () => {
    return items.filter(item => {
      const course = item.course;
      return course.listed && course.isActive && !course.isBanned;
    });
  };

  const calculateAvailableTotal = () => {
    return getAvailableItems().reduce((total, item) => {
      const discountedPrice = calculateDiscountedPrice(item.course.price, item.course.offer_percentage);
      return total + discountedPrice;
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
                
                {/* Unavailable courses notification */}
                {items.length > 0 && getAvailableItems().length < items.length && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-sm text-red-800">
                          <strong>{items.length - getAvailableItems().length}</strong> course{items.length - getAvailableItems().length > 1 ? 's are' : ' is'} no longer available and cannot be purchased.
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveUnavailable}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                      >
                        Remove Unavailable
                      </button>
                    </div>
                  </div>
                )}
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
                    const isUnavailable = !course.listed || !course.isActive || course.isBanned;
                    
                    return (
                      <div key={item._id} className={`p-6 ${isUnavailable ? 'bg-red-50 border-l-4 border-red-400' : ''}`}>
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden relative">
                            <img
                              src={course.course_thumbnail}
                              alt={course.title}
                              className={`w-full h-full object-cover ${isUnavailable ? 'opacity-50 grayscale' : ''}`}
                            />
                            {isUnavailable && (
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">Unavailable</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className={`text-lg font-semibold line-clamp-2 ${isUnavailable ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {course.title}
                                </h3>
                                {isUnavailable && (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Course no longer available
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveItem(course._id)}
                                className="text-gray-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                            
                            <p className={`mb-2 ${isUnavailable ? 'text-gray-400' : 'text-gray-600'}`}>
                              By {course.tutor?.full_name}
                            </p>
                            
                            {!isUnavailable && (
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
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isUnavailable ? (
                                  <span className="text-lg font-bold text-gray-400">
                                    Not Available
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-xl font-bold text-gray-900">
                                      ₹{discountedPrice.toFixed(2)}
                                    </span>
                                    {course.offer_percentage > 0 && (
                                      <span className="text-sm text-gray-500 line-through">
                                        ₹{course.price.toFixed(2)}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {!isUnavailable && (
                                  <button
                                    onClick={() => handleMoveToWishlist(course._id)}
                                    className="flex items-center gap-1 px-3 py-1 text-sm text-sky-600 hover:text-sky-700 border border-sky-200 rounded-md hover:bg-sky-50"
                                  >
                                    <Heart className="h-4 w-4" />
                                    Save for later
                                  </button>
                                )}
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
                
                {getAvailableItems().length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No available courses in cart</p>
                    <Link
                      to="/user/courses"
                      className="inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                    >
                      Browse Courses
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price ({getAvailableItems().length} items)</span>
                        <span className="font-medium">₹{(calculateAvailableTotal() + calculateTotalSavings()).toFixed(2)}</span>
                      </div>
                      
                      {calculateTotalSavings() > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-₹{calculateTotalSavings().toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (3%)</span>
                        <span className="font-medium">₹{(calculateAvailableTotal() * 0.03).toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>₹{(calculateAvailableTotal() + (calculateAvailableTotal() * 0.03)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigate('/user/checkout')}
                      className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mb-3"
                    >
                      Proceed to Checkout
                    </button>
                  </>
                )}
                
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