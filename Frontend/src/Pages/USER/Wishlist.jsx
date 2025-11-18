import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, Heart, Filter, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import UserSidebar from '../../components/UserSidebar';
import { getWishlist, removeFromWishlist, moveToCart, clearWishlist } from '../../Redux/wishlistSlice';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function Wishlist() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, error } = useSelector(state => state.wishlist);
  const { user } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(getWishlist());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleRemoveItem = async (courseId) => {
    try {
      await dispatch(removeFromWishlist(courseId)).unwrap();
      toast.success('Course removed from wishlist');
    } catch (error) {
      toast.error(error.message || 'Failed to remove course');
    }
  };

  const handleMoveToCart = async (courseId) => {
    try {
      await dispatch(moveToCart(courseId)).unwrap();
      // Refresh wishlist data after moving to cart
      dispatch(getWishlist());
      toast.success('Course moved to cart');
    } catch (error) {
      toast.error(error.message || 'Failed to move course');
    }
  };

  // Check if user has purchased a course (handle populated course objects)
  const isPurchased = (courseId) => {
    return user?.courses?.some(c => {
      const courseId_in_user = c.course?._id || c.course;
      return courseId_in_user?.toString() === courseId;
    });
  };

  const handleClearWishlist = async () => {
    try {
      await dispatch(clearWishlist()).unwrap();
      toast.success('Wishlist cleared');
    } catch (error) {
      toast.error(error.message || 'Failed to clear wishlist');
    }
  };

  const calculateDiscountedPrice = (price, offerPercentage) => {
    if (!offerPercentage) return price;
    return price - (price * offerPercentage / 100);
  };

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item =>
      item.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.course.tutor?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedAt) - new Date(a.addedAt);
        case 'price-low':
          return calculateDiscountedPrice(a.course.price, a.course.offer_percentage) -
            calculateDiscountedPrice(b.course.price, b.course.offer_percentage);
        case 'price-high':
          return calculateDiscountedPrice(b.course.price, b.course.offer_percentage) -
            calculateDiscountedPrice(a.course.price, a.course.offer_percentage);
        case 'rating':
          return (b.course.average_rating || 0) - (a.course.average_rating || 0);
        default:
          return 0;
      }
    });

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
                <span className="text-gray-500 text-sm sm:text-base">Wishlist</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Common Sidebar */}
          <div className="lg:w-80 lg:flex-shrink-0">
            <UserSidebar activeSection="wishlist" />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wishlist</h1>
                  {items.length > 0 && (
                    <button
                      onClick={handleClearWishlist}
                      className="text-red-600 hover:text-red-700 text-sm font-medium self-start sm:self-auto"
                    >
                      Clear Wishlist
                    </button>
                  )}
                </div>
              </div>

              {/* Search and Filter */}
              {items.length > 0 && (
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search wishlist..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm sm:text-base"
                      />
                      <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm sm:text-base"
                      >
                        <option value="newest">Newest</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Wishlist Items */}
              {filteredAndSortedItems.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Heart className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {items.length === 0 ? 'Your wishlist is empty' : 'No courses found'}
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base">
                    {items.length === 0
                      ? 'Save courses you\'re interested in to your wishlist.'
                      : 'Try adjusting your search or filter criteria.'
                    }
                  </p>
                  <Link
                    to="/browse/courses"
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors text-sm sm:text-base"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAndSortedItems.map((item) => {
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
                                {isPurchased(course._id) ? (
                                  <button
                                    onClick={() => navigate(`/user/learn/${course._id}`)}
                                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
                                  >
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Go to Course</span>
                                    <span className="sm:hidden">Go to</span>
                                  </button>
                                ) : !isUnavailable ? (
                                  <button
                                    onClick={() => handleMoveToCart(course._id)}
                                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors text-sm sm:text-base"
                                  >
                                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Add To Cart</span>
                                    <span className="sm:hidden">Add</span>
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed text-sm sm:text-base"
                                  >
                                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Unavailable</span>
                                    <span className="sm:hidden">N/A</span>
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
        </div>
      </div>

      <Footer />
    </div>
  );
}