import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Star, Users, ChevronDown, X, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import PriceDisplay from '../../components/PriceDisplay';
import Loading from '../../ui/Loading';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { createOrGetChat } from '../../Redux/chatSlice';
import {
  fetchPublicCategories,
  fetchPublicCourses,
  fetchCoursesByCategory,
  setFilters,
  resetFilters,
  clearError
} from '../../Redux/userCourseSlice';
const CourseListing = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    categories,
    courses,
    pagination,
    loading,
    categoriesLoading,
    error,
    selectedCategory
  } = useSelector((state) => state.userCourses);
  const { user } = useCurrentUser();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sort: 'newest'
  });
  useEffect(() => {
    dispatch(fetchPublicCategories());
  }, [dispatch]);
  useEffect(() => {
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const rating = searchParams.get('rating') || '';
    const page = parseInt(searchParams.get('page')) || 1;

    setLocalFilters(prev => ({
      ...prev,
      search,
      category: categoryId || '',
      sort,
      minPrice,
      maxPrice,
      rating
    }));

    dispatch(setFilters({
      search,
      category: categoryId || '',
      sort,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      rating: rating || null
    }));

    if (categoryId) {
      dispatch(fetchCoursesByCategory({
        categoryId,
        params: {
          page,
          sort,
          search: search || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          rating: rating || undefined
        }
      }));
    } else {
      dispatch(fetchPublicCourses({
        page,
        search,
        sort,
        limit: 12,
        category: categoryId || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        rating: rating || undefined
      }));
    }
  }, [searchParams, dispatch]);
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);
  const handleSearch = (e) => {
    e.preventDefault();
    updateURLParams({ search: localFilters.search, page: 1 });
  };
  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const applyFilters = () => {
    const filterParams = {
      page: 1,
      search: localFilters.search,
      sort: localFilters.sort
    };
    if (localFilters.category) {
      filterParams.category = localFilters.category;
    }
    if (localFilters.minPrice) {
      filterParams.minPrice = localFilters.minPrice;
    }
    if (localFilters.maxPrice) {
      filterParams.maxPrice = localFilters.maxPrice;
    }
    if (localFilters.rating) {
      filterParams.rating = localFilters.rating;
    }
    updateURLParams(filterParams);
    setShowFilters(false);
  };
  const clearFilters = () => {
    setLocalFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      sort: 'newest'
    });
    dispatch(resetFilters());
    setSearchParams({});
  };
  const updateURLParams = (params) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };
  const handlePageChange = (page) => {
    updateURLParams({ page });
  };
  const handleCategorySelect = (categoryId) => {
    setLocalFilters(prev => ({ ...prev, category: categoryId }));
    if (categoryId) {
      updateURLParams({ category: categoryId, page: 1 });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      newParams.set('page', '1');
      setSearchParams(newParams);
    }
  };
  const handleCourseClick = (courseId) => {
    navigate(`/user/course/${courseId}`);
  };

  const handleChatClick = async (tutorId) => {
    try {
      await dispatch(createOrGetChat({ tutorId })).unwrap();
      navigate('/user/chat');
    } catch (error) {
      toast.error(error || 'Failed to start chat');
    }
  };
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' }
  ];
  if (loading && courses.length === 0) {
    return <Loading />;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedCategory ? `${selectedCategory.title} Courses` : 'All Courses'}
          </h1>
          <p className="text-gray-600">
            {selectedCategory
              ? selectedCategory.description
              : 'Discover amazing courses from expert tutors'
            }
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={localFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </form>
            <div className="relative">
              <select
                value={localFilters.sort}
                onChange={(e) => {
                  handleFilterChange('sort', e.target.value);
                  updateURLParams({ sort: e.target.value, page: 1 });
                }}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={localFilters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    placeholder="₹0"
                    value={localFilters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="₹10000"
                    value={localFilters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={applyFilters}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCategorySelect('')}
              className={`px-4 py-2 rounded-full border transition-colors ${!localFilters.category
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-teal-600 hover:text-teal-600'
                }`}
            >
              All Categories
            </button>
            {categoriesLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                <span className="text-gray-600">Loading categories...</span>
              </div>
            ) : (
              categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`px-4 py-2 rounded-full border transition-colors ${localFilters.category === category.id
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-teal-600 hover:text-teal-600'
                    }`}
                >
                  {category.title}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-600">
            {loading ? (
              'Loading courses...'
            ) : (
              `Showing ${courses.length} of ${pagination.totalItems} courses`
            )}
          </div>
          {(localFilters.search || localFilters.category) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse different categories.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => handleCourseClick(course.id)}
                onChatClick={handleChatClick}
                user={user}

              />
            ))}
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {[...Array(pagination.totalPages)].map((_, index) => {
                const page = index + 1;
                const isCurrentPage = page === pagination.currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 border rounded-lg ${isCurrentPage
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};
const CourseCard = ({ course, onClick, onChatClick, user }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating)
          ? 'text-yellow-400 fill-current'
          : 'text-gray-300'
          }`}
      />
    ));
  };

  // Check if user has purchased this course
  const hasPurchased = user?.courses?.some(enrollment => 
    enrollment.course === course.id
  );

  const handleChatClick = (e) => {
    e.stopPropagation();
    if (hasPurchased && course.tutor?._id) {
      onChatClick(course.tutor._id);
    } else {
      toast.info('Purchase this course to chat with the tutor');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div onClick={onClick} className="cursor-pointer">
        <img
          src={course.course_thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {course.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <img
              src={course.tutor?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
              alt={course.tutor?.full_name}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-gray-600">
              {course.tutor?.full_name}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {renderStars(course.average_rating)}
            </div>
            <span className="text-sm text-gray-600">
              {course.average_rating?.toFixed(1) || '0.0'} ({course.total_reviews || 0})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              {course.enrolled_count}
            </div>
            <PriceDisplay
              price={course.price}
              offerPercentage={course.offer_percentage}
            />
          </div>
        </div>
      </div>
      
      {/* Chat button - only show if user has purchased the course */}
      {hasPurchased && (
        <div className="px-4 pb-4">
          <button
            onClick={handleChatClick}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Tutor
          </button>
        </div>
      )}
    </div>
  );
};
export default CourseListing;
