import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Award, TrendingUp } from 'lucide-react';
import Button from "../../ui/Button";
import PriceDisplay from "../../components/PriceDisplay";
import BannerImg from "../../assets/banner.png";
import { MdFavoriteBorder } from "react-icons/md";
import PublicLayout from "../../components/Layout/PublicLayout";
import { userAPI } from "../../api/axiosConfig";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useLogout } from "../../hooks/useLogout";
import { toast } from 'react-toastify';
export default function UserHomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useCurrentUser();
  const { forceLogout } = useLogout('user');
  const hasCheckedStatus = useRef(false);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [featuredTutors, setFeaturedTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname);
    const preventBack = () => {
      window.history.pushState(null, '', window.location.pathname);
    };
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, []);
  useEffect(() => {
    async function verifyAndLoadUser() {
      if (hasCheckedStatus.current) return;
      hasCheckedStatus.current = true;
      try {
        if (!isAuthenticated) {
          navigate('/user/login');
          return;
        }
        const response = await userAPI.get('/api/users/check-status');
        const data = response.data;
        if (data.isBlocked) {
          await forceLogout();
          return;
        }
        
        // Load dashboard data after verification
        await loadDashboardData();
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          await forceLogout();
        }
      }
    }
    verifyAndLoadUser();
  }, [navigate, isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard data, featured courses, and tutors in parallel
      const [dashboardRes, coursesRes, tutorsRes] = await Promise.all([
        userAPI.get('/api/users/dashboard-data'),
        userAPI.get('/api/users/featured-courses'),
        userAPI.get('/api/users/featured-tutors')
      ]);

      setDashboardData(dashboardRes.data);
      setFeaturedCourses(coursesRes.data.courses || []);
      setFeaturedTutors(tutorsRes.data.tutors || []);
      

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Use dynamic data or fallback to defaults
  const userProgress = dashboardData?.userProgress || {
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalHours: 0,
    certificates: 0
  };

  const enrolledCourses = dashboardData?.enrolledCourses || [];

  // Helper function to get expertise area for tutors
  const getExpertiseArea = (tutor) => {
    // Use subjects if available
    if (tutor.subjects && tutor.subjects.length > 0) {
      return tutor.subjects.slice(0, 2).join(', ');
    }
    
    if (tutor.expertise) return tutor.expertise;
    
    // Generate expertise based on tutor name or random selection
    const expertiseAreas = [
      'Web Development',
      'Data Science',
      'UI/UX Design',
      'Digital Marketing',
      'Mobile Development',
      'Machine Learning',
      'Graphic Design',
      'Business Strategy',
      'Photography',
      'Content Writing',
      'Software Engineering',
      'Cybersecurity'
    ];
    
    // Use tutor ID to consistently assign the same expertise
    const index = tutor._id ? tutor._id.slice(-1).charCodeAt(0) % expertiseAreas.length : 0;
    return expertiseAreas[index];
  };

  // Helper function to get random profile images
  const getRandomProfileImage = (tutorId) => {
    const profileImages = [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=150&fit=crop&crop=face"
    ];
    
    // Use tutor ID to consistently assign the same image
    const index = tutorId ? tutorId.slice(-1).charCodeAt(0) % profileImages.length : 0;
    return profileImages[index];
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </PublicLayout>
    );
  }
  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Welcome back, {user?.full_name || user?.name || 'Student'}! 👋
                </h1>
                <p className="text-xl text-gray-600">
                  Continue your learning journey and achieve your goals.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate('/browse/courses')}
                  className="bg-teal-600 hover:bg-teal-700 px-6 py-3"
                >
                  Browse Courses
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/user/teachers')}
                  className="border-teal-600 text-teal-600 hover:bg-teal-50 px-6 py-3"
                >
                  Find Tutors
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-white p-4 rounded-3xl shadow-lg">
                <img
                  src={BannerImg}
                  alt="Continue Learning"
                  className="w-full max-w-md mx-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sky-600 text-sm font-medium">Courses Enrolled</p>
                  <p className="text-2xl font-bold text-sky-900">{userProgress.coursesEnrolled}</p>
                </div>
                <BookOpen className="w-8 h-8 text-sky-600" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{userProgress.coursesCompleted}</p>
                </div>
                <Award className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Certificates</p>
                  <p className="text-2xl font-bold text-orange-900">{userProgress.certificates}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Continue Learning</h2>
            <Link to="/browse/courses" className="text-teal-600 hover:underline font-medium">
              View All Courses
            </Link>
          </div>
          {enrolledCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div key={course._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <img
                    src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">by {course.instructor}</p>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-700 ease-out ${
                            course.progress === 100 
                              ? 'bg-gradient-to-r from-green-400 to-green-600' 
                              : course.progress >= 75 
                              ? 'bg-gradient-to-r from-blue-400 to-blue-600' 
                              : course.progress >= 50 
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                              : 'bg-gradient-to-r from-teal-400 to-teal-600'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      {course.completionStatus && (
                        <div className="flex items-center mt-2 text-green-600 text-sm">
                          <Award className="w-4 h-4 mr-1" />
                          <span>Completed</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span></span>
                      <Button 
                        onClick={() => navigate(`/user/learn/${course._id}`)}
                        className="bg-teal-600 hover:bg-teal-700 px-4 py-2 text-sm"
                      >
                        {course.completionStatus ? 'Review' : 'Continue'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrolled Courses</h3>
              <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course</p>
              <Button 
                onClick={() => navigate('/browse/courses')}
                className="bg-teal-600 hover:bg-teal-700 px-6 py-3"
              >
                Browse Courses
              </Button>
            </div>
          )}
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Browse All Courses</h2>
            <Link to="/browse/courses" className="text-teal-600 hover:underline font-medium">
              See All
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {featuredCourses.map((course) => (
              <div
                key={course._id}
                className="flex-none w-[300px]"
              >
                <div className="h-full border rounded-lg overflow-hidden hover:shadow-md transition-shadow relative">
                  <img
                    src={
                      course.course_thumbnail ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"
                    }
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                    <MdFavoriteBorder className="w-6 h-6" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={
                          course.tutor?.profile_image ||
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                        }
                        alt={course.tutor?.full_name || "Tutor"}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-gray-600">
                        {course.tutor?.full_name || "Unknown Tutor"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <PriceDisplay price={course.price} offerPercentage={course.offer_percentage} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Meet Our Expert Tutors</h2>
            <div className="flex items-center gap-4">
             
              <Link to="/user/teachers" className="text-teal-600 hover:underline font-medium">
                View All Tutors
              </Link>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse bg-white rounded-lg p-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : 
          featuredTutors.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredTutors.slice(0, 4).map((tutor) => (
                  <div key={tutor._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 text-center">
                    <img
                      src={tutor.profileImage || getRandomProfileImage(tutor._id)}
                      alt={tutor.full_name}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-4 border-gray-100"
                    />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{tutor.full_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{getExpertiseArea(tutor)}</p>
                    
                    <Button
                      onClick={() => navigate('/user/teachers')}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg text-sm"
                    >
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
              
              {featuredTutors.length > 4 && (
                <div className="text-center mt-8">
                  <Button
                    onClick={() => navigate('/user/teachers')}
                    className="bg-teal-600 hover:bg-teal-700 px-6 py-3"
                  >
                    View All Tutors
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tutors Available</h3>
              <p className="text-gray-600">Check back later for expert tutors</p>
            </div>
          )}
        </div>
      </section>
      
   
     
    </PublicLayout>
  );
}
