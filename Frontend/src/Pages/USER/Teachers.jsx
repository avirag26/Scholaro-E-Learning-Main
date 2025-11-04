import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from "./Common/Header";
import Footer from '../../components/Common/Footer';
import useUserInfo from '../../hooks/useUserInfo';
import { tutorService } from '../../services/tutorService';
import { DEFAULT_IMAGES } from '../../constants/defaults';
import { ROUTES, safeNavigate } from '../../utils/navigationUtils';

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTutors, setTotalTutors] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [subjectFilter, setSubjectFilter] = useState('');
  const userInfo = useUserInfo();


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, subjectFilter]);

  const fetchTeachers = async () => {
    try {
      setError(null);

      // Use initial loading only for first load, search loading for subsequent searches
      if (currentPage === 1 && !debouncedSearchTerm && !subjectFilter && initialLoading) {
        setInitialLoading(true);
      } else {
        setSearchLoading(true);
      }

      const params = {
        page: currentPage,
        search: debouncedSearchTerm,
        subject: subjectFilter
      };

      const data = await tutorService.getPublicTutors(params);
      const tutorsData = data.tutors || [];
      setTeachers(tutorsData);
      setTotalPages(data.totalPages || 1);
      setTotalTutors(data.total || 0);
      setPageSize(data.limit || 12);

      if (tutorsData.length === 0 && currentPage === 1) {
        toast.info('No tutors found');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError(error.message);
      toast.error(`Failed to load teachers: ${error.response?.data?.message || error.message}`);
      setTeachers([]);
      setTotalPages(1);
      setTotalTutors(0);
    } finally {
      setInitialLoading(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, debouncedSearchTerm, subjectFilter, initialLoading]);
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleSendMessage = () => {
    toast.info('Messaging feature coming soon!');
  };
  const handleTutorClick = (tutorId) => {
    safeNavigate(navigate, ROUTES.USER.TUTOR_DETAIL(tutorId));
  };

  // Safety check for userInfo (after all hooks)
  if (!userInfo && !error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  // Error boundary
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={userInfo} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setInitialLoading(true);
                fetchTeachers();
              }}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show full page loader only for initial loading
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={userInfo} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading teachers...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  try {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={userInfo} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          { }
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutors</h1>
            <p className="text-gray-600">Find the perfect tutor for your learning journey</p>
          </div>
          {/* Search Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Name Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tutors by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            {/* Subject Search */}
            <div className="md:w-80 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by subject (e.g., Math, Physics)..."
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
              {subjectFilter && (
                <button
                  onClick={() => setSubjectFilter('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-6 flex items-center gap-3">
            {searchLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500"></div>
            )}
            <p className="text-gray-600">
              {searchLoading ? (
                'Searching tutors...'
              ) : (
                `Showing ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalTutors)} of ${totalTutors} tutors`
              )}
            </p>
          </div>
          {/* Teachers Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${searchLoading ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}>
            {teachers.map((teacher) => (
              <div
                key={teacher._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 cursor-pointer"
                onClick={() => handleTutorClick(teacher._id)}
              >
                { }
                <div className="text-center mb-4">
                  <img
                    src={teacher.profileImage || DEFAULT_IMAGES.PROFILE}
                    alt={teacher.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-gray-100"
                  />
                </div>
                { }
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {teacher.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {teacher.subjects}
                  </p>
                  { }
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-3">
                    {teacher.rating && (
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-400">?</span>
                        {teacher.rating}
                      </span>
                    )}
                    {teacher.totalStudents && (
                      <span>{teacher.totalStudents} students</span>
                    )}
                  </div>
                  { }
                  {teacher.bio && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                      {teacher.bio}
                    </p>
                  )}
                </div>
                { }
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTutorClick(teacher._id);
                    }}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                  >
                    View Profile
                  </button>

                </div>
              </div>
            ))}
          </div>
          {/* Empty State */}
          {teachers.length === 0 && !initialLoading && !searchLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {debouncedSearchTerm || subjectFilter ? 'No tutors found' : 'No tutors available'}
              </h3>
              <p className="text-gray-600">
                {debouncedSearchTerm || subjectFilter
                  ? 'Try adjusting your search terms or filters to find more tutors.'
                  : 'There are currently no verified tutors in the system. Please check back later.'
                }
              </p>
              {(debouncedSearchTerm || subjectFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSubjectFilter('');
                  }}
                  className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {!initialLoading && !searchLoading && totalTutors > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} ({totalTutors} total tutors)
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      const isCurrentPage = page === currentPage;

                      // Show first page, last page, current page, and pages around current page
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 border rounded-lg transition-colors ${isCurrentPage
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 py-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  } catch (renderError) {
    console.error('Teachers component render error:', renderError);
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={userInfo} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">💥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Component Error</h2>
            <p className="text-gray-600 mb-4">There was an error rendering this page</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
};
export default Teachers;
