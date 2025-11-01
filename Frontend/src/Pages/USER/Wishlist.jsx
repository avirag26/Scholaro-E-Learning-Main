import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, Heart, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import UserSidebar from '../../components/UserSidebar';
import { getWishlist, removeFromWishlist, moveToCart, clearWishlist } from '../../Redux/wishlistSlice';

export default function Wishlist() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector(state => state.wishlist);
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
                <span className="text-gray-500">Wishlist</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex gap-8">
          {/* Common Sidebar */}
          <UserSidebar activeSection="wishlist" />

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
                  {items.length > 0 && (
                    <button
                      onClick={handleClearWishlist}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Clear Wishlist
                    </button>
                  )}
                </div>
              </div>

              {/* Search and Filter */}
              {items.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search wishlist..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-gray-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                <div className="p-12 text-center">
                  <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {items.length === 0 ? 'Your wishlist is empty' : 'No courses found'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {items.length === 0 
                      ? 'Save courses you\'re interested in to your wishlist.' 
                      : 'Try adjusting your search or filter criteria.'
                    }
                  </p>
                  <Link
                    to="/user/courses"
                    className="inline-flex items-center px-6 py-3 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAndSortedItems.map((item) => {
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
                                  onClick={() => handleMoveToCart(course._id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors"
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                  Add To Cart
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
        </div>
      </div>
      
      <Footer />
    </div>
  );
}