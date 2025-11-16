import { useState, useEffect } from 'react';
import { Star, Clock, BookOpen, Award, Play, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import Loading from '../../ui/Loading';
import { userAPI } from '../../api/axiosConfig';

const MyCourses = () => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [completedCourses, setCompletedCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMyCourses();
    }, []);


    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector('input[placeholder*="Search courses"]')?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const fetchMyCourses = async () => {
        try {
            setLoading(true);
            const response = await userAPI.get('/api/users/my-courses');
            if (response.data.success) {
                const enrolled = response.data.enrolledCourses || [];
                const completed = response.data.completedCourses || [];


                setEnrolledCourses(enrolled);
                setCompletedCourses(completed);
            }
        } catch (error) {
            toast.error('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };


    const filterCourses = (courses) => {
        if (!searchTerm) return courses;

        return courses.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.tutor?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.category?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        });
    };

    const getFilteredCourses = (courses) => {
        return filterCourses(courses);
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
                        <>
                            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Completed
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => window.location.href = `/user/learn/${course._id}`}
                                        className="bg-white text-gray-900 px-3 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-100 text-sm"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Review
                                    </button>
                                    <button
                                        onClick={() => window.location.href = `/user/course/${course._id}/exam`}
                                        className="bg-green-500 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-green-600 text-sm"
                                    >
                                        <Award className="w-4 h-4" />
                                        Certificate
                                    </button>
                                </div>
                            </div>
                        </>
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


                    {!isCompleted && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">Progress</span>
                                <span className="text-xs text-gray-600 font-semibold">
                                    {course.progress || 0}%
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 lesson-progress-bar">
                                    <div
                                        className="h-2 rounded-full lesson-progress-fill bg-green-500"
                                        style={{
                                            width: `${Math.min(100, Math.max(0, course.progress || 0))}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}

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

                    {/* Search and Filter Section */}
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search courses by title, instructor, or category... (Ctrl+K)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>



                    </div>

                    {/* Search Results Summary */}
                    {searchTerm && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-800 font-medium">
                                        Showing {getFilteredCourses([...enrolledCourses, ...completedCourses]).length} of {enrolledCourses.length + completedCourses.length} courses
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-blue-600">
                                        <span className="bg-blue-100 px-2 py-1 rounded">
                                            Search: "{searchTerm}"
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    Clear Search
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Enrolled Courses */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Enrolled Courses</h2>
                            <span className="text-sm text-gray-600">
                                {getFilteredCourses(enrolledCourses).length} of {enrolledCourses.length} courses
                            </span>
                        </div>

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
                        ) : getFilteredCourses(enrolledCourses).length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg border">
                                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No courses match your filters
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Try adjusting your search terms or filters to find your courses.
                                </p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {getFilteredCourses(enrolledCourses).map((course, index) => (
                                    <CourseCard key={course._id || index} course={course} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Completed Courses */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Completed Courses</h2>
                            <span className="text-sm text-gray-600">
                                {getFilteredCourses(completedCourses).length} of {completedCourses.length} courses
                            </span>
                        </div>

                        {completedCourses.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-lg border">
                                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed courses yet</h3>
                                <p className="text-gray-600">
                                    Complete all lessons in a course to see it here with your certificate.
                                </p>
                            </div>
                        ) : getFilteredCourses(completedCourses).length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-lg border">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600">
                                    No completed courses match your current filters.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {getFilteredCourses(completedCourses).map((course, index) => (
                                    <CourseCard key={course._id || index} course={course} isCompleted={true} />
                                ))}
                            </div>
                        )}
                    </div>


                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MyCourses;