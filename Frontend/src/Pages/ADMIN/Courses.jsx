import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, Filter, ChevronLeft, ChevronRight, Users, Star, BookOpen } from "lucide-react";
import AdminLayout from "./common/AdminLayout";
import PriceDisplay from "../../components/PriceDisplay";
import { adminAPI } from "../../api/axiosConfig";

const Courses = () => {
  const navigate = useNavigate();
  const [coursesByCategory, setCoursesByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPages, setCurrentPages] = useState({});

  const coursesPerPage = 3;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAllCourses();
  }, [debouncedSearchTerm, statusFilter]);

  const fetchAllCourses = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/api/admin/courses', {
        params: {
          search: debouncedSearchTerm,
          status: statusFilter
        }
      });

      if (response.data.success) {
        setCoursesByCategory(response.data.coursesByCategory);
        // Initialize current pages for each category
        const initialPages = {};
        response.data.coursesByCategory.forEach(category => {
          initialPages[category.id] = 0;
        });
        setCurrentPages(initialPages);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = (categoryId, totalCourses) => {
    setCurrentPages(prev => ({
      ...prev,
      [categoryId]: prev[categoryId] + coursesPerPage >= totalCourses 
        ? 0 
        : prev[categoryId] + coursesPerPage
    }));
  };

  const handlePrevPage = (categoryId, totalCourses) => {
    setCurrentPages(prev => ({
      ...prev,
      [categoryId]: prev[categoryId] === 0 
        ? Math.max(0, totalCourses - coursesPerPage)
        : prev[categoryId] - coursesPerPage
    }));
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

  if (loading) {
    return (
      <AdminLayout title="Courses">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="All Courses" subtitle="Manage all courses across categories">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
            <p className="text-gray-600">Browse and manage all courses by category</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-80"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Courses</option>
              <option value="listed">Listed Only</option>
              <option value="unlisted">Unlisted Only</option>
              <option value="active">Active Only</option>
            </select>
            
            <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Courses by Category */}
      <div className="space-y-8">
        {coursesByCategory.length > 0 ? (
          coursesByCategory.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow p-8">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>
                
                {category.courses.length > coursesPerPage && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePrevPage(category.id, category.courses.length)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleNextPage(category.id, category.courses.length)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Courses Grid */}
              {category.courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.courses
                    .slice(currentPages[category.id] || 0, (currentPages[category.id] || 0) + coursesPerPage)
                    .map((course) => (
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
                              {category.title}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              course.listed 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {course.listed ? 'Listed' : 'Unlisted'}
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
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <BookOpen className="w-4 h-4" />
                                <span>{course.totalLessons || 0}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <PriceDisplay
                                price={course.price}
                                offerPercentage={course.offer_percentage}
                                size="sm"
                              />
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <button 
                              onClick={() => navigate(`/admin/courses/${course.id}/details`)}
                              className="w-full bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                            >
                              VIEW COURSE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses in this category</h3>
                  <p className="text-gray-600">No courses match your current filters.</p>
                </div>
              )}

              {/* Pagination Dots */}
              {category.courses.length > coursesPerPage && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.ceil(category.courses.length / coursesPerPage) }, (_, i) => {
                      const pageIndex = i * coursesPerPage;
                      const isActive = (currentPages[category.id] || 0) === pageIndex;
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPages(prev => ({ ...prev, [category.id]: pageIndex }))}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            isActive ? 'bg-teal-500' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No courses have been created yet."
              }
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Courses;