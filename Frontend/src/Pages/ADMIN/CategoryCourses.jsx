import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, ArrowLeft, Users, Star } from "lucide-react";
import AdminLayout from "./common/AdminLayout";
import PriceDisplay from "../../components/PriceDisplay";
import { adminAPI } from "../../api/axiosConfig";

const CategoryCourses = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [category, setCategory] = useState(null);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const filterDropdownRef = useRef(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch courses when component mounts or search/page changes
  useEffect(() => {
    fetchCourses();
  }, [categoryId, currentPage, debouncedSearchTerm, statusFilter, ratingFilter, minPrice, maxPrice]);

  // Reset to first page when search changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);

      const response = await adminAPI.get(`/api/admin/categories/${categoryId}/courses`, {
        params: {
          page: currentPage,
          limit: 12,
          search: debouncedSearchTerm,
          status: statusFilter,
          rating: ratingFilter,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined
        }
      });

      if (response.data.success) {
        setCourses(response.data.courses || []);
        setCategory(response.data.category);
        setPagination(response.data.pagination || {});
      } else {
        toast.error(response.data.message || "Failed to fetch courses");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch courses";
      toast.error(errorMessage);
      setCourses([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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

  if (loading && !courses.length) {
    return (
      <AdminLayout title="Category Courses">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`${category?.title || 'Category'} Courses`}
      subtitle={`Manage courses in ${category?.title || 'this category'}`}
    >
      {/* Header with back button */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/categories')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Categories
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {category?.title?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{category?.title}</h1>
              <p className="text-gray-600">{category?.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Courses"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-80"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span>Filter</span>
                <svg className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="all">All Courses</option>
                        <option value="listed">Listed Only</option>
                        <option value="unlisted">Unlisted Only</option>

                      </select>
                    </div>



                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="Min Price"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="Max Price"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setStatusFilter("all");
                          setRatingFilter("all");
                          setMinPrice("");
                          setMaxPrice("");
                          setShowFilterDropdown(false);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="flex-1 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {loading ? 'Loading...' : `${pagination.totalItems || 0} Courses Found`}
          </h3>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Try adjusting your search criteria."
                : "No courses have been added to this category yet."
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={course.course_thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        {category?.title}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={course.tutor?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
                        alt={course.tutor?.full_name}
                        className="w-8 h-8 rounded-full border-2 border-gray-100"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {course.tutor?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">Instructor</p>
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg">
                      {course.title}
                    </h4>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {renderStars(course.average_rating)}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {course.average_rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({course.total_reviews} reviews)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{course.enrolled_count}</span>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/courses/${course.id}/details`)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          VIEW COURSE
                        </button>
                      </div>
                      <div className="text-right">
                        <PriceDisplay
                          price={course.price}
                          offerPercentage={course.offer_percentage}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                    let page;
                    if (pagination.totalPages <= 5) {
                      page = index + 1;
                    } else {
                      const start = Math.max(1, pagination.currentPage - 2);
                      page = start + index;
                    }

                    if (page > pagination.totalPages) return null;

                    const isCurrentPage = page === pagination.currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-colors ${isCurrentPage
                          ? 'bg-teal-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default CategoryCourses;