import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTutors, setTotalTutors] = useState(0);
  const [pageSize, setPageSize] = useState(12); // Will be set by server response
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

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
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
        setPageSize(data.limit || 12); // Get page size from server

        if (tutorsData.length === 0 && currentPage === 1) {
          toast.info('No tutors found');
        }
      } catch (error) {
        toast.error(`Failed to load teachers: ${error.response?.data?.message || error.message}`);
        setTeachers([]);
        setTotalPages(1);
        setTotalTutors(0);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [currentPage, debouncedSearchTerm, subjectFilter]);
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubjectFilter = (subject) => {
    setSubjectFilter(subject);
    setShowFilter(false);
  };
  const handleSendMessage = () => {
    toast.info('Messaging feature coming soon!');
  };
  const handleTutorClick = (tutorId) => {
    safeNavigate(navigate, ROUTES.USER.TUTOR_DETAIL(tutorId));
  };
  if (loading) {
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
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userInfo} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        { }
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutors</h1>
          <p className="text-gray-600">Find the perfect tutor for your learning journey</p>
        </div>
        { }
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          { }
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tutors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          { }
          <div className="flex gap-4">
            {/* <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div> */}
            { }
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
        {/* Filter Dropdown */}
        {showFilter && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">Filter by Subject</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSubjectFilter('')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${!subjectFilter
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All Subjects
              </button>
              {['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science', 'Programming'].map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectFilter(subject)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${subjectFilter === subject
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? (
              'Loading tutors...'
            ) : (
              `Showing ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalTutors)} of ${totalTutors} tutors`
            )}
          </p>
        </div>
        {/* Teachers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        {teachers.length === 0 && !loading && (
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
        {!loading && totalTutors > 0 && (
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
};
export default Teachers;
