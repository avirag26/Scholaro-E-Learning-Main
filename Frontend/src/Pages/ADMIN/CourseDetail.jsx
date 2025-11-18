import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Users,
  Star,
  CheckCircle,
  PlayCircle,
  ArrowLeft,
  Calendar,
  Award,
  TrendingUp,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from './common/AdminLayout';
import PriceDisplay from '../../components/PriceDisplay';
import { adminAPI } from '../../api/axiosConfig';
import Swal from 'sweetalert2';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.get(`/api/admin/courses/${courseId}/details`);
        if (response.data.success) {
          setCourse(response.data.course);
        } else {
          toast.error('Failed to load course details');
          navigate('/admin/courses');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load course details');
        navigate('/admin/courses');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId, navigate]);

  const handleToggleListing = async () => {
    const action = course.listed ? 'unlist' : 'list';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Course?`,
      text: course.listed
        ? 'This course will be hidden from students and they won\'t be able to enroll.'
        : 'This course will be visible to students and they can enroll.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: course.listed ? '#ef4444' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      const response = await adminAPI.patch(`/api/admin/courses/${courseId}/toggle-listing`);
      if (response.data.success) {
        setCourse(prev => ({ ...prev, listed: !prev.listed }));
        toast.success(`Course ${action}ed successfully!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} course`);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleLessonPublish = async (lessonId, currentStatus) => {
    setActionLoading(true);
    try {
      const response = await adminAPI.patch(`/api/admin/lessons/${lessonId}/toggle-publish`);
      if (response.data.success) {
        setCourse(prev => ({
          ...prev,
          lessons: prev.lessons.map(lesson =>
            lesson._id === lessonId
              ? { ...lesson, isPublished: !currentStatus }
              : lesson
          )
        }));

        toast.success(`Lesson ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lesson status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewLesson = (lesson) => {
    navigate(`/admin/lessons/${lesson._id}/view/${courseId}`);
  };

  if (loading) {
    return (
      <AdminLayout title="Course Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!course) {
    return (
      <AdminLayout title="Course Details">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or is not available.</p>
          <button
            onClick={() => navigate('/admin/courses')}
            className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Course Details" subtitle={`Manage course: ${course.title}`}>
      {/* Back Button */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to Courses
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Course Header */}
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <span className="inline-block px-3 sm:px-4 py-1 sm:py-2 bg-teal-100 text-teal-800 text-xs sm:text-sm font-semibold rounded-full">
                  {course.category?.title || 'Course'}
                </span>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${course.listed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {course.listed ? 'Listed' : 'Unlisted'}
                </span>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${course.isActive
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {course.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                {course.title}
              </h1>
              <p className="text-gray-600 text-base sm:text-lg lg:text-xl leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Course Stats */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                <span className="font-medium">{course.enrolled_count || 0} students</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                <span className="font-medium hidden sm:inline">Created {new Date(course.createdAt).toLocaleDateString()}</span>
                <span className="font-medium sm:hidden">{new Date(course.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                <span className="font-medium">{course.lessons?.length || 0} lessons</span>
              </div>
              {course.average_rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                  <span className="font-medium">{course.average_rating.toFixed(1)} ({course.total_reviews || 0})</span>
                </div>
              )}
            </div>

            {/* Instructor Info */}
            <div className="border-t pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Instructor</h3>
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                <img
                  src={course.tutor?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"}
                  alt={course.tutor?.full_name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                    {course.tutor?.full_name || 'Course Instructor'}
                  </h4>
                  <p className="text-gray-600 mb-2 text-sm sm:text-base">Professional Instructor</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span>ID: {course.tutor?.tutor_id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs self-start sm:self-auto ${course.tutor?.is_blocked
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                      }`}>
                      {course.tutor?.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What Students Learn */}
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">What students will learn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base lg:text-lg">Master {course.category?.title || 'the subject'} fundamentals and core concepts</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base lg:text-lg">Build practical projects and real-world applications</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base lg:text-lg">Learn industry best practices and professional techniques</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 text-sm sm:text-base lg:text-lg">Get hands-on experience with {course.lessons?.length || 'multiple'} practical lessons</span>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Course content</h2>
              <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-auto">
                {course.lessons?.length || 0} lessons
              </span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {course.lessons && course.lessons.length > 0 ? (
                course.lessons.map((lesson, index) => (
                  <div key={lesson._id || index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg">
                          {lesson.title || `Lesson ${index + 1}`}
                        </h4>
                        <p className="text-gray-600 text-xs sm:text-sm truncate sm:whitespace-normal">
                          {lesson.description || 'Course lesson content'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lesson.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {lesson.isPublished ? 'Published' : 'Unpublished'}
                          </span>
                          <div className="text-xs sm:text-sm text-gray-500 font-medium">
                            {lesson.duration || '10:00'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
                      <button
                        onClick={() => handleViewLesson(lesson)}
                        className="inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        <ExternalLink className="h-3 h-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">View</span>
                        <span className="sm:hidden">View</span>
                      </button>
                      <button
                        onClick={() => toggleLessonPublish(lesson._id, lesson.isPublished)}
                        disabled={actionLoading}
                        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${lesson.isPublished
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50`}
                      >
                        {lesson.isPublished ? (
                          <>
                            <EyeOff className="h-3 h-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Unpublish</span>
                            <span className="sm:hidden">Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 h-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Publish</span>
                            <span className="sm:hidden">Show</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <PlayCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Course Content</h3>
                  <p className="text-sm sm:text-base">This course doesn't have any lessons yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden sticky top-4 lg:top-8">
            {/* Course Thumbnail */}
            <div className="relative">
              <img
                src={course.course_thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop"}
                alt={course.title}
                className="w-full h-40 sm:h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <Play className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Price */}
              <div className="mb-4 sm:mb-6">
                <PriceDisplay
                  price={course.price}
                  offerPercentage={course.offer_percentage}
                  size="lg"
                />
              </div>

              {/* Course Stats */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm sm:text-base">Students</span>
                  <span className="font-semibold text-sm sm:text-base">{course.enrolled_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm sm:text-base">Lessons</span>
                  <span className="font-semibold text-sm sm:text-base">{course.lessons?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm sm:text-base">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-sm sm:text-base">{course.average_rating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm sm:text-base">Reviews</span>
                  <span className="font-semibold text-sm sm:text-base">{course.total_reviews || 0}</span>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handleToggleListing}
                  disabled={actionLoading}
                  className={`w-full flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base ${course.listed
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                    } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {course.listed ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {actionLoading ? 'Processing...' : (course.listed ? 'Unlist Course' : 'List Course')}
                </button>

                <button className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-blue-50 text-blue-600 py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm sm:text-base">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  View Analytics
                </button>

                <button className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-gray-50 text-gray-600 py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm sm:text-base">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  Course Reports
                </button>
              </div>

              {/* Course Info */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Course Information</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span>{new Date(course.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={course.listed ? 'text-green-600' : 'text-red-600'}>
                      {course.listed ? 'Listed' : 'Unlisted'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </AdminLayout>
  );
};

export default CourseDetail;