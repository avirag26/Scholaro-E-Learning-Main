import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Heart, ShoppingBag, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import UserSidebar from '../../components/UserSidebar';
import { getCart, removeFromCart, clearCart, moveToWishlist, removeUnavailableFromCart } from '../../Redux/cartSlice';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalItems, loading, error } = useSelector(state => state.cart);
  const { user } = useCurrentUser();
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
      const isPurchased = user?.courses?.some(c => {
        const courseId_in_user = c.course?._id || c.course;
        return courseId_in_user?.toString() === course._id;
      });
      return course.listed && course.isActive && !course.isBanned && !isPurchased;
    });
  };

  const getPurchasedItems = () => {
    return items.filter(item => {
      const course = item.course;
      return user?.courses?.some(c => {
        const courseId_in_user = c.course?._id || c.course;
        return courseId_in_user?.toString() === course._id;
      });
    });
  };

  const getUnavailableItems = () => {
    return items.filter(item => {
      const course = item.course;
      const isPurchased = user?.courses?.some(c => {
        const courseId_in_user = c.course?._id || c.course;
        return courseId_in_user?.toString() === course._id;
      });
      return !course.listed || !course.isActive || course.isBanned || isPurchased;
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-4 sm:mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/user/home" className="text-gray-700 hover:text-sky-500 text-sm sm:text-base">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500 text-sm sm:text-base">Shopping Cart</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Common Sidebar */}
          <div className="lg:w-80 lg:flex-shrink-0">
            <UserSidebar activeSection="cart" />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col xl:flex-row gap-4 sm:gap-6 lg:gap-8 min-w-0">
            {/* Cart Items */}
            <div className="xl:w-2/3 flex-1 min-w-0">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shopping Cart</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="text-gray-600 text-sm sm:text-base">{totalItems} Course{totalItems !== 1 ? 's' : ''} in cart</span>
                      {items.length > 0 && (
                        <button
                          onClick={handleClearCart}
                          className="text-red-600 hover:text-red-700 text-sm font-medium self-start sm:self-auto"
                        >
                          Clear Cart
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Unavailable and purchased courses notification */}
                  {items.length > 0 && getAvailableItems().length < items.length && (
                    <div className="mt-4 space-y-2">
                      {getPurchasedItems().length > 0 && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <p className="text-sm text-green-800">
                                <strong>{getPurchasedItems().length}</strong> course{getPurchasedItems().length > 1 ? 's are' : ' is'} already purchased and will be removed from cart.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {getUnavailableItems().length > getPurchasedItems().length && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <p className="text-sm text-red-800">
                                <strong>{getUnavailableItems().length - getPurchasedItems().length}</strong> course{(getUnavailableItems().length - getPurchasedItems().length) > 1 ? 's are' : ' is'} no longer available and cannot be purchased.
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
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <ShoppingBag className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base">Looks like you haven't added any courses yet.</p>
                    <Link
                      to="/user/courses"
                      className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors text-sm sm:text-base"
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
                        <div key={item._id} className={`p-4 sm:p-6 ${isUnavailable ? 'bg-red-50 border-l-4 border-red-400' : ''}`}>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden relative flex-shrink-0">
                              <img
                                src={course.course_thumbnail}
                                alt={course.title}
                                className={`w-full h-full object-cover ${isUnavailable ? 'opacity-50 grayscale' : ''}`}
                              />
                              {isUnavailable && (
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                  <span className="text-white text-xs sm:text-sm font-medium">Unavailable</span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0 pr-2">
                                  <h3 className={`text-base sm:text-lg font-semibold line-clamp-2 ${isUnavailable ? 'text-gray-500' : 'text-gray-900'}`}>
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
                                  className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                              </div>

                              <p className={`mb-2 text-sm sm:text-base ${isUnavailable ? 'text-gray-400' : 'text-gray-600'}`}>
                                By {course.tutor?.full_name}
                              </p>

                              {!isUnavailable && (
                                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs sm:text-sm">
                                  <div className="flex items-center">
                                    <span className="text-yellow-400">★</span>
                                    <span className="text-gray-600 ml-1">
                                      {course.average_rating?.toFixed(1) || 'No rating'} ({course.total_reviews || 0} reviews)
                                    </span>
                                  </div>
                                  <span className="text-gray-400 hidden sm:inline">•</span>
                                  <span className="text-gray-600">{course.lessons?.length || 0} lessons</span>
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  {isUnavailable ? (
                                    <span className="text-base sm:text-lg font-bold text-gray-400">
                                      Not Available
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-lg sm:text-xl font-bold text-gray-900">
                                        ₹{discountedPrice.toFixed(2)}
                                      </span>
                                      {course.offer_percentage > 0 && (
                                        <span className="text-xs sm:text-sm text-gray-500 line-through">
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
                                      className="flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm text-sky-600 hover:text-sky-700 border border-sky-200 rounded-md hover:bg-sky-50"
                                    >
                                      <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="hidden sm:inline">Save for later</span>
                                      <span className="sm:hidden">Save</span>
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
              <div className="xl:w-1/3 xl:flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 xl:sticky xl:top-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Order Details</h2>

                  {getAvailableItems().length === 0 ? (
                    <div className="text-center py-4 sm:py-6">
                      <p className="text-gray-500 mb-4 text-sm sm:text-base">No available courses in cart</p>
                      <Link
                        to="/user/courses"
                        className="inline-flex items-center px-3 sm:px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm sm:text-base"
                      >
                        Browse Courses
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600">Price ({getAvailableItems().length} items)</span>
                          <span className="font-medium">₹{(calculateAvailableTotal() + calculateTotalSavings()).toFixed(2)}</span>
                        </div>

                        {calculateTotalSavings() > 0 && (
                          <div className="flex justify-between text-green-600 text-sm sm:text-base">
                            <span>Discount</span>
                            <span>-₹{calculateTotalSavings().toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600">Tax (3%)</span>
                          <span className="font-medium">₹{(calculateAvailableTotal() * 0.03).toFixed(2)}</span>
                        </div>

                        <div className="border-t pt-3">
                          <div className="flex justify-between text-base sm:text-lg font-bold">
                            <span>Total</span>
                            <span>₹{(calculateAvailableTotal() + (calculateAvailableTotal() * 0.03)).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/user/checkout')}
                        className="w-full bg-gray-900 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mb-3 text-sm sm:text-base"
                      >
                        Proceed to Checkout
                      </button>
                    </>
                  )}

                  <Link
                    to="/user/courses"
                    className="block w-full text-center py-2 sm:py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
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