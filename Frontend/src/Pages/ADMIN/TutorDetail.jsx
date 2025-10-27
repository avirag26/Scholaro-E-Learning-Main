import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Clock, 
  Mail, 
  Phone,
  Calendar,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Star,
  Award,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from './common/AdminLayout';
import PriceDisplay from '../../components/PriceDisplay';
import StarRating from '../../components/StarRating';
import { adminAPI } from '../../api/axiosConfig';

const TutorDetail = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);
  const coursesPerPage = 4;

  useEffect(() => {
    const fetchTutorDetails = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.get(`/api/admin/tutors/${tutorId}/details`);
        if (response.data.success) {
          setTutor(response.data.tutor);
        } else {
          toast.error('Failed to load tutor details');
          navigate('/admin/tutors');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load tutor details');
        navigate('/admin/tutors');
      } finally {
        setLoading(false);
      }
    };

    if (tutorId) {
      fetchTutorDetails();
    }
  }, [tutorId, navigate]);

  const nextCourse = () => {
    if (tutor && tutor.courses.length > 0) {
      setCurrentCourseIndex((prev) => 
        prev + coursesPerPage >= tutor.courses.length ? 0 : prev + coursesPerPage
      );
    }
  };

  const prevCourse = () => {
    if (tutor && tutor.courses.length > 0) {
      setCurrentCourseIndex((prev) => 
        prev === 0 ? Math.max(0, tutor.courses.length - coursesPerPage) : prev - coursesPerPage
      );
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Tutor Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!tutor) {
    return (
      <AdminLayout title="Tutor Details">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tutor not found</h2>
          <p className="text-gray-600 mb-4">The tutor you're looking for doesn't exist or is not available.</p>
          <button
            onClick={() => navigate('/admin/tutors')}
            className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Back to Tutors
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tutor Details" subtitle={`Detailed information about ${tutor.full_name}`}>
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/tutors')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tutors
        </button>
      </div>

      {/* Tutor Profile Section */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Info */}
          <div className="flex-1">
            <div className="flex items-start gap-6 mb-8">
              <img
                src={tutor.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                alt={tutor.full_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{tutor.full_name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tutor.is_blocked 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {tutor.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tutor.is_verified 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tutor.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">Tutor ID: {tutor.tutor_id}</p>
                <p className="text-lg text-gray-700">{tutor.subjects || 'Professional Tutor'}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{tutor.email}</span>
                  </div>
                  {tutor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{tutor.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      Joined {new Date(tutor.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      Last Login: {tutor.lastLogin ? new Date(tutor.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      Profile Updated: {new Date(tutor.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {tutor.bio && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                <p className="text-gray-600 leading-relaxed">{tutor.bio}</p>
              </div>
            )}
          </div>

          {/* Statistics Sidebar */}
          <div className="lg:w-80">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistics</h3>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-sky-600 mb-1">
                    {tutor.statistics?.totalCourses || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {tutor.statistics?.totalStudents || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {tutor.statistics?.totalReviews || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Reviews</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                    <span className="text-3xl font-bold text-yellow-600">
                      {tutor.statistics?.averageRating || '0.0'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Courses by {tutor.full_name.split(' ')[0]}
          </h2>
          {tutor.courses && tutor.courses.length > coursesPerPage && (
            <div className="flex gap-2">
              <button
                onClick={prevCourse}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextCourse}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {tutor.courses && tutor.courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tutor.courses
              .slice(currentCourseIndex, currentCourseIndex + coursesPerPage)
              .map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  tutorName={tutor.full_name}
                />
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Available</h3>
            <p className="text-gray-600">
              {tutor.full_name.split(' ')[0]} hasn't published any courses yet.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const CourseCard = ({ course, tutorName }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border overflow-hidden">
      <div className="relative">
        <img
          src={course.course_thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"}
          alt={course.title}
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            course.listed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {course.listed ? 'Listed' : 'Unlisted'}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
          {course.title}
        </h3>
        
        <div className="mb-2">
          <StarRating 
            rating={course.average_rating || 0} 
            size="sm" 
            showValue={true}
            totalReviews={course.total_reviews || 0}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.totalDuration || 0}h
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {course.totalLessons || 0} lectures
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {course.enrolled_count || 0}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {course.category?.title || 'General'}
          </span>
          <PriceDisplay
            price={course.price}
            offerPercentage={course.offer_percentage}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};

export default TutorDetail;