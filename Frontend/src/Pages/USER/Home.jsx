import { useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Clock, Award, TrendingUp, Star } from 'lucide-react';
import Button from "../../ui/Button";
import PriceDisplay from "../../components/PriceDisplay";
import CategoryCards from "../../ui/CategoryCards";
import Testimonials from "../../ui/Testmonials";
import TeamSection from "../../ui/TeamSection";
import BannerImg from "../../assets/banner.png";
import { MdFavoriteBorder } from "react-icons/md";
import Header from "./Common/Header";
import Footer from "../../components/Common/Footer";
import { userAPI } from "../../api/axiosConfig";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useLogout } from "../../hooks/useLogout";
export default function UserHomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useCurrentUser();
  const { forceLogout } = useLogout('user');
  const hasCheckedStatus = useRef(false);
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
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          await forceLogout();
        }
      }
    }
    verifyAndLoadUser();
  }, [navigate, isAuthenticated]);
  const userProgress = {
    coursesEnrolled: 3,
    coursesCompleted: 1,
    totalHours: 24,
    certificates: 1
  };
  const enrolledCourses = [
    {
      id: 1,
      title: "React for Beginners",
      instructor: "John Doe",
      progress: 75,
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
      duration: "8 hours"
    },
    {
      id: 2,
      title: "JavaScript Fundamentals",
      instructor: "Jane Smith",
      progress: 45,
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
      duration: "12 hours"
    },
    {
      id: 3,
      title: "UI/UX Design Basics",
      instructor: "Mike Johnson",
      progress: 20,
      thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop",
      duration: "6 hours"
    }
  ];
  const courses = [
    { _id: '1', title: 'React for Beginners', course_thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop', tutor: { full_name: 'John Doe' }, rating: 4.5, reviews: { length: 120 }, price: 499, offer_percentage: 10 },
    { _id: '2', title: 'Advanced CSS and Sass', course_thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop', tutor: { full_name: 'Jane Smith' }, rating: 4.8, reviews: { length: 250 }, price: 799, offer_percentage: 20 },
    { _id: '3', title: 'JavaScript: The Hard Parts', course_thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=200&fit=crop', tutor: { full_name: 'Will Sentance' }, rating: 4.9, reviews: { length: 500 }, price: 999, offer_percentage: 0 },
    { _id: '4', title: 'Node.js, Express, MongoDB', course_thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop', tutor: { full_name: 'Jonas S.' }, rating: 4.7, reviews: { length: 450 }, price: 899, offer_percentage: 15 },
    { _id: '5', title: 'Python for Everybody', course_thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop', tutor: { full_name: 'Charles Severance' }, rating: 4.9, reviews: { length: 1000 }, price: 0, offer_percentage: 0 },
    { _id: '6', title: 'UI/UX Design Fundamentals', course_thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop', tutor: { full_name: 'Gary Simon' }, rating: 4.6, reviews: { length: 300 }, price: 699, offer_percentage: 5 },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Welcome back, {user?.name || 'Student'}! 👋
                </h1>
                <p className="text-xl text-gray-600">
                  Continue your learning journey and achieve your goals.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate('/user/courses')}
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
          <div className="grid md:grid-cols-4 gap-6">
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
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sky-600 text-sm font-medium">Learning Hours</p>
                  <p className="text-2xl font-bold text-sky-900">{userProgress.totalHours}</p>
                </div>
                <Clock className="w-8 h-8 text-sky-600" />
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
            <Link to="/user/courses" className="text-teal-600 hover:underline font-medium">
              View All Courses
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <img
                  src={course.thumbnail}
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
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{course.duration}</span>
                    <Button className="bg-teal-600 hover:bg-teal-700 px-4 py-2 text-sm">
                      Continue
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Browse All Courses</h2>
            <Link to="/user/courses" className="text-teal-600 hover:underline font-medium">
              See All
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {courses.map((course) => (
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
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(course.rating || 0) ? "fill-current" : ""}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({course.reviews?.length || 0} reviews)
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
            <Link to="/user/teachers" className="text-teal-600 hover:underline font-medium">
              View All Tutors
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {}
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 text-center">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                alt="Expert Tutor"
                className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-4 border-gray-100"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">John Smith</h3>
              <p className="text-sm text-gray-600 mb-2">Web Development</p>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-3">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>4.9 � 150+ students</span>
              </div>
              <Button
                onClick={() => navigate('/user/teachers')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg text-sm"
              >
                View Profile
              </Button>
            </div>
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 text-center">
              <img
                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
                alt="Expert Tutor"
                className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-4 border-gray-100"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Sarah Johnson</h3>
              <p className="text-sm text-gray-600 mb-2">Data Science</p>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-3">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>4.8 � 200+ students</span>
              </div>
              <Button
                onClick={() => navigate('/user/teachers')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg text-sm"
              >
                View Profile
              </Button>
            </div>
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 text-center">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                alt="Expert Tutor"
                className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-4 border-gray-100"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Michael Chen</h3>
              <p className="text-sm text-gray-600 mb-2">UI/UX Design</p>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-3">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>4.7 � 180+ students</span>
              </div>
              <Button
                onClick={() => navigate('/user/teachers')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg text-sm"
              >
                View Profile
              </Button>
            </div>
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 text-center">
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
                alt="Expert Tutor"
                className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-4 border-gray-100"
              />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Emily Davis</h3>
              <p className="text-sm text-gray-600 mb-2">Digital Marketing</p>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-3">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>4.9 � 220+ students</span>
              </div>
              <Button
                onClick={() => navigate('/user/teachers')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg text-sm"
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </section>
      <CategoryCards />
      <Testimonials />
      <TeamSection />
      <Footer />
    </div>
  );
}
