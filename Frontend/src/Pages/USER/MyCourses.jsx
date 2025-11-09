import { useState, useEffect } from 'react';
import { Star, Clock, BookOpen, Award, Play } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import Loading from '../../ui/Loading';
import { userAPI } from '../../api/axiosConfig';

const MyCourses = () => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [completedCourses, setCompletedCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            setLoading(true);
            const response = await userAPI.get('/api/users/my-courses');
            if (response.data.success) {
                setEnrolledCourses(response.data.enrolledCourses || []);
                setCompletedCourses(response.data.completedCourses || []);
            }
        } catch (error) {
            toast.error('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                className={`w-4 h-4 ${index < Math.floor(rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                    }`}
            />
        ));
    };

    const CourseCard = ({ course, isCompleted = false }) => {
        return (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                    <img
                        src={course.course_thumbnail || 'https://via.placeholder.com/400x200?text=Course+Image'}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x200?text=Course+Image';
                        }}
                    />
                    {isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Completed
                        </div>
                    )}
                    {!isCompleted && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => window.location.href = `/user/learn/${course._id}`}
                                className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-100"
                            >
                                <Play className="w-4 h-4" />
                                Continue Learning
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                        {course.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-2">
                        By {course.tutor?.full_name || 'Unknown Instructor'}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                            {renderStars(course.average_rating || 0)}
                        </div>
                        <span className="text-sm text-gray-600">
                            ({course.total_ratings || 0} Ratings)
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{course.lessons?.length || 0} Lessons</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
                        <p className="text-gray-600">
                            Continue your learning journey with your enrolled courses
                        </p>

                    </div>

                    {/* Enrolled Courses */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Enrolled Courses</h2>

                        {enrolledCourses.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg border">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No enrolled courses yet
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Purchase courses to start your learning journey. Your enrolled courses will appear here.
                                </p>
                                <button
                                    onClick={() => window.location.href = '/user/courses'}
                                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                                >
                                    Browse Courses
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {enrolledCourses.map((course, index) => (
                                    <CourseCard key={course._id || index} course={course} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Completed Courses */}
                    {completedCourses.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Courses</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {completedCourses.map((course, index) => (
                                    <CourseCard key={course._id || index} course={course} isCompleted={true} />
                                ))}
                            </div>
                        </div>
                    )}


                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MyCourses;