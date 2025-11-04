import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Clock, 
  Mail, 
  Globe, 
  Twitter, 
  Youtube,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import PriceDisplay from '../../components/PriceDisplay';
import StarRating from '../../components/StarRating';
import Loading from '../../ui/Loading';
import useUserInfo from '../../hooks/useUserInfo';
import { tutorService } from '../../services/tutorService';
import { DEFAULT_IMAGES, DEFAULT_TEXTS, PAGINATION } from '../../constants/defaults';
import { ROUTES, safeNavigate } from '../../utils/navigationUtils';
import TutorStatsCard from '../../components/TutorStatsCard';
const TutorDetail = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [tutorStats, setTutorStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);
  const userInfo = useUserInfo();
  useEffect(() => {
    const fetchTutorDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch tutor details and stats in parallel
        const [tutorData, statsData] = await Promise.all([
          tutorService.getTutorDetails(tutorId),
          tutorService.getTutorStats(tutorId)
        ]);
        
        if (tutorData.success) {
          setTutor(tutorData.tutor);
        } else {
          toast.error('Failed to load tutor details');
          safeNavigate(navigate, ROUTES.USER.TEACHERS);
        }
        
        if (statsData && statsData.success) {
          setTutorStats(statsData.stats);
        } else {
          // Set default stats if API fails
          setTutorStats({
            studentCount: 0,
            totalCourses: 0,
            totalEnrollments: 0,
            averageRating: 0.0
          });
        }
        
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load tutor details');
        safeNavigate(navigate, ROUTES.USER.TEACHERS);
      } finally {
        setLoading(false);
      }
    };
    if (tutorId) {
      fetchTutorDetails();
    }
  }, [tutorId, navigate]);
  const handleCourseClick = (courseId) => {
    safeNavigate(navigate, ROUTES.USER.COURSE_DETAIL(courseId));
  };
  const handleSendMessage = () => {
  };
  const nextCourse = () => {
    if (tutor && tutor.courses.length > 0) {
      setCurrentCourseIndex((prev) => 
        prev === tutor.courses.length - PAGINATION.COURSES_PER_ROW ? 0 : prev + 1
      );
    }
  };
  const prevCourse = () => {
    if (tutor && tutor.courses.length > 0) {
      setCurrentCourseIndex((prev) => 
        prev === 0 ? Math.max(0, tutor.courses.length - PAGINATION.COURSES_PER_ROW) : prev - 1
      );
    }
  };
  if (loading) {
    return <Loading />;
  }
  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={userInfo} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tutor not found</h2>
            <p className="text-gray-600 mb-4">The tutor you're looking for doesn't exist or is not available.</p>
            <button
              onClick={() => safeNavigate(navigate, ROUTES.USER.TEACHERS)}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Back to Teachers
            </button>
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
        {}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {}
            <div className="flex-1">
              <div className="mb-6">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">INSTRUCTOR</p>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{tutor.name}</h1>
                <p className="text-lg text-gray-600 mb-6">{tutor.subjects}</p>
              </div>
              {}
              {/* Stats */}
              <TutorStatsCard stats={tutorStats} loading={loading} className="mb-8" />
              {}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {tutor.name.split(' ')[0]}</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {tutor.bio}
                </p>
              </div>
              {}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Expertise</h3>
                <ul className="space-y-2">
                  {tutor.subjects && tutor.subjects.split(',').map((subject, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      {subject.trim()}
                    </li>
                  ))}
                  {!tutor.subjects && (
                    <li className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      Professional Tutor
                    </li>
                  )}
                </ul>
              </div>
              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Experience</h3>
                <p className="text-gray-600 leading-relaxed">
                  {tutor.name} has an extensive professional background in {tutor.subjects ? tutor.subjects.toLowerCase() : 'education'}, having worked with renowned 
                  companies and institutions. Their portfolio includes a diverse range of projects 
                  spanning various educational domains and helping students achieve their learning goals.
                </p>
              </div>
            </div>
            {}
            <div className="lg:w-80">
              <div className="text-center mb-6">
                <img
                  src={tutor.profileImage || DEFAULT_IMAGES.PROFILE}
                  alt={tutor.name}
                  className="w-48 h-48 rounded-full object-cover mx-auto border-8 border-gray-100 shadow-lg"
                />
              </div>
              {}
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-3 bg-blue-50 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors">
                  <Globe className="w-5 h-5" />
                  Website
                </button>
                <button className="w-full flex items-center justify-center gap-3 bg-blue-50 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors">
                  <Twitter className="w-5 h-5" />
                  Twitter
                </button>
                <button className="w-full flex items-center justify-center gap-3 bg-red-50 text-red-600 py-3 px-4 rounded-lg hover:bg-red-100 transition-colors">
                  <Youtube className="w-5 h-5" />
                  YouTube
                </button>
              </div>
              {}
             
            </div>
          </div>
        </div>
        {}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Courses by <span className="text-teal-600">{tutor.name.split(' ')[0]}</span>
            </h2>
            {tutor.courses && tutor.courses.length > PAGINATION.COURSES_PER_ROW && (
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tutor.courses
                  .slice(currentCourseIndex, currentCourseIndex + PAGINATION.COURSES_PER_ROW)
                  .map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      tutorName={tutor.name}
                      onClick={() => handleCourseClick(course.id)}
                    />
                  ))}
              </div>
              {tutor.courses.length > PAGINATION.COURSES_PER_ROW && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => navigate(`/user/courses?tutor=${tutorId}`)}
                    className="px-6 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    View All {tutor.courses.length} Courses
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Available</h3>
              <p className="text-gray-600">
                {tutor.name.split(' ')[0]} hasn't published any courses yet. Check back later for new content!
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};
const CourseCard = ({ course, tutorName, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border"
    >
      <div className="relative">
        <img
          src={course.course_thumbnail || DEFAULT_IMAGES.COURSE_THUMBNAIL}
          alt={course.title}
          className="w-full h-40 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Play className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
          {course.title}
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          By {tutorName}
        </p>
        <div className="mb-2">
          <StarRating 
            rating={course.average_rating} 
            size="sm" 
            showValue={true}
            totalReviews={course.total_reviews}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.totalDuration}h
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {course.totalLessons} lectures
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {course.enrolled_count}
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
