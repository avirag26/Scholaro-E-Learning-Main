import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, Users, Star, Globe, Award, CheckCircle, PlayCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import PublicLayout from '../../components/Layout/PublicLayout';
import PriceDisplay from '../../components/PriceDisplay';
import CourseDetailActions from '../../components/CourseDetailActions';
import Loading from '../../ui/Loading';
import { fetchCourseDetails } from '../../Redux/userCourseSlice';
import { useCurrentUser } from '../../hooks/useCurrentUser';
const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { selectedCourse, courseDetailsLoading, error } = useSelector((state) => state.userCourses);
    const { user } = useCurrentUser();
    useEffect(() => {
        if (courseId) {
            dispatch(fetchCourseDetails(courseId));
        }
    }, [courseId, dispatch]);
    if (courseDetailsLoading) {
        return <Loading />;
    }
    if (error) {
        return (
            <PublicLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/browse/courses')}
                            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                            Back to Courses
                        </button>
                    </div>
                </div>
            </PublicLayout>
        );
    }
    if (!selectedCourse) {
        return <Loading />;
    }
    
     // Check if user has purchased this course (handle both populated and non-populated course objects)
     const isPurchased = user?.courses?.some(c => {
       const courseId_in_user = c.course?._id || c.course;
       return courseId_in_user?.toString() === courseId;
     });

    const handleEnrollNow = async () => {
        if (!selectedCourse) {
            toast.error('Course not found');
            return;
        }

        if (isPurchased) {
            toast.info('You are already enrolled in this course');
            return;
        }

        // Navigate to checkout with course data in state (bypassing cart)
        navigate('/user/checkout', {
            state: {
                directEnrollment: true,
                course: selectedCourse
            }
        });
    };
    return (
        <PublicLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                            <div className="mb-4">
                                <button
                                    onClick={() => navigate('/browse/courses')}
                                    className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                                >
                                    ← Back to Courses
                                </button>
                            </div>
                            <div className="mb-6">
                                <span className="inline-block px-4 py-2 bg-teal-100 text-teal-800 text-sm font-semibold rounded-full mb-4">
                                    {selectedCourse.category?.title || 'Course'}
                                </span>
                                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                    {selectedCourse.title}
                                </h1>
                                <p className="text-gray-600 text-xl leading-relaxed">
                                    {selectedCourse.description}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-8 text-sm text-gray-600 mb-8">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-teal-600" />
                                    <span className="font-medium">{selectedCourse.enrolled_count || 0} students enrolled</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-teal-600" />
                                    <span className="font-medium">Updated {new Date(selectedCourse.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PlayCircle className="w-5 h-5 text-teal-600" />
                                    <span className="font-medium">{selectedCourse.lessons?.length || 0} lessons</span>
                                </div>
                                {selectedCourse.average_rating > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                        <span className="font-medium">{selectedCourse.average_rating.toFixed(1)} ({selectedCourse.total_reviews || 0} reviews)</span>
                                    </div>
                                )}
                            </div>
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor</h3>
                                <div className="flex items-center gap-6">
                                    <img
                                        src={selectedCourse.tutor?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"}
                                        alt={selectedCourse.tutor?.full_name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                    />
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">
                                            {selectedCourse.tutor?.full_name || 'Course Instructor'}
                                        </h4>
                                        <p className="text-gray-600 mb-2">Professional Instructor</p>
                                        <p className="text-sm text-gray-500">
                                            Expert in {selectedCourse.category?.title || 'this field'} with years of teaching experience
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 text-lg">Master {selectedCourse.category?.title || 'the subject'} fundamentals and core concepts</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 text-lg">Build practical projects and real-world applications</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 text-lg">Learn industry best practices and professional techniques</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 text-lg">Get hands-on experience with {selectedCourse.lessons?.length || 'multiple'} practical lessons</span>
                                </div>
                                {selectedCourse.lessons && selectedCourse.lessons.length > 0 && (
                                    <>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700 text-lg">Develop problem-solving and analytical skills</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700 text-lg">Apply knowledge to real-world scenarios and projects</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Course content</h2>
                                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                    {selectedCourse.lessons?.length || 0} lessons
                                </span>
                            </div>
                            <div className="space-y-4">
                                {selectedCourse.lessons && selectedCourse.lessons.length > 0 ? (
                                    selectedCourse.lessons.map((lesson, index) => (
                                        <div key={lesson._id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                                    <PlayCircle className="w-5 h-5 text-teal-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-lg">
                                                        {lesson.title || `Lesson ${index + 1}`}
                                                    </h4>
                                                    <p className="text-gray-600">
                                                        {lesson.description || 'Course lesson content'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500 font-medium">
                                                {lesson.duration || '0:00'}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <PlayCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Course Content Coming Soon</h3>
                                        <p>Detailed course content will be available after enrollment</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Course</h2>
                            <div className="prose max-w-none text-gray-700">
                                <p className="text-lg leading-relaxed">{selectedCourse.description}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-8">
                            <div>
                                <img
                                    src={selectedCourse.course_thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop"}
                                    alt={selectedCourse.title}
                                    className="w-full h-48 object-cover"
                                />
                            </div>
                            <div className="p-8">
                                <div className="mb-8 text-center">
                                    <PriceDisplay
                                        price={selectedCourse.price}
                                        offerPercentage={selectedCourse.offer_percentage}
                                        className="text-3xl"
                                    />
                                    {selectedCourse.offer_percentage > 0 && (
                                        <p className="text-red-600 font-medium mt-2">
                                            Limited time offer - {selectedCourse.offer_percentage}% off!
                                        </p>
                                    )}
                                </div>
                                {!isPurchased ? (
                                    <button 
                                        onClick={handleEnrollNow}
                                        className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-teal-700 hover:to-teal-800 transition-all transform hover:scale-105 mb-4 shadow-lg"
                                    >
                                        Enroll Now
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => navigate(`/user/learn/${courseId}`)}
                                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 mb-4 shadow-lg"
                                    >
                                        Continue Learning
                                    </button>
                                )}


                                {/* Cart and Wishlist Actions */}
                                <CourseDetailActions 
                                    courseId={selectedCourse.id || selectedCourse._id} 
                                    course={selectedCourse}
                                    isPurchased={isPurchased}
                                    className="mb-6" 
                                />
                                <div className="border-t pt-6">
                                    <h3 className="font-bold text-gray-900 mb-4 text-lg">This course includes:</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <PlayCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                                            <span className="text-gray-700">{selectedCourse.lessons?.length || 0} on-demand video lessons</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Award className="w-5 h-5 text-teal-600 flex-shrink-0" />
                                            <span className="text-gray-700">Certificate of completion</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-5 h-5 text-teal-600 flex-shrink-0" />
                                            <span className="text-gray-700">Full lifetime access</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Users className="w-5 h-5 text-teal-600 flex-shrink-0" />
                                            <span className="text-gray-700">Access on mobile and desktop</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-teal-600 flex-shrink-0" />
                                            <span className="text-gray-700">Learn at your own pace</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Instructor</h2>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-shrink-0">
                            <img
                                src={selectedCourse.tutor?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                                alt={selectedCourse.tutor?.full_name}
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {selectedCourse.tutor?.full_name || 'Course Instructor'}
                            </h3>
                            <p className="text-gray-600 text-lg mb-4">
                                Course Instructor
                            </p>
                            {selectedCourse.tutor?.bio && (
                                <p className="text-gray-700 leading-relaxed">
                                    {selectedCourse.tutor.bio}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};
export default CourseDetail;
