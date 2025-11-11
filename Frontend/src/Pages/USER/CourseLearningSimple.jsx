import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, BookOpen, Clock, MessageCircle, Award, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import { userAPI } from '../../api/axiosConfig';
import PDFViewer from '../../components/PDFViewer';
import '../../styles/videoProtection.css';

const CourseLearning = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [videoLoading, setVideoLoading] = useState(false);
    const [examEligibility, setExamEligibility] = useState(null);
    const [checkingExam, setCheckingExam] = useState(false);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [lessonProgress, setLessonProgress] = useState(null);

    useEffect(() => {
        fetchCourseData();
        checkExamEligibility();
        loadLessonProgress();
    }, [courseId]);

    useEffect(() => {
        if (lessons.length > 0 && !currentLesson) {
            // Find the first published lesson
            const firstPublishedLesson = lessons.find(lesson => lesson.isPublished);
            const firstPublishedIndex = lessons.findIndex(lesson => lesson.isPublished);
            
            if (firstPublishedLesson) {
                setCurrentLesson(firstPublishedLesson);
                setCurrentLessonIndex(firstPublishedIndex);
            } else {
                // If no published lessons, show a message
                setCurrentLesson(null);
                setCurrentLessonIndex(0);
            }
            setVideoLoading(false); // Ensure loading is false for first lesson
        }
    }, [lessons, currentLesson]);

    useEffect(() => {
     
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        
        const handleKeyDown = (e) => {
           
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                (e.ctrlKey && e.key === 'u') ||
                (e.ctrlKey && e.key === 's') ||
                e.key === 'PrintScreen'
            ) {
                e.preventDefault();
                return false;
            }
        };

      
        const handleSelectStart = (e) => {
            e.preventDefault();
            return false;
        };

 
        const handleDragStart = (e) => {
            e.preventDefault();
            return false;
        };

        // Add event listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('dragstart', handleDragStart);

       
        const detectScreenRecording = () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
              
            }
        };

        detectScreenRecording();

        // Cleanup
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('dragstart', handleDragStart);
        };
    }, []);

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            const response = await userAPI.get(`/api/users/course/${courseId}/learn`);
            if (response.data.success) {
                setCourse(response.data.course);
                setLessons(response.data.lessons || []);
            }
        } catch (error) {
            toast.error('Failed to load course data');
            navigate('/user/my-courses');
        } finally {
            setLoading(false);
        }
    };

    const checkExamEligibility = async () => {
        try {
            setCheckingExam(true);
            const response = await userAPI.get(`/api/users/courses/${courseId}/exam-eligibility`);
            setExamEligibility(response.data);
        } catch (error) {
            setExamEligibility(null);
        } finally {
            setCheckingExam(false);
        }
    };

    const loadLessonProgress = async () => {
        try {
            const response = await userAPI.get(`/api/users/courses/${courseId}/lesson-progress`);
            if (response.data.success) {
                setLessonProgress(response.data);
                setCompletedLessons(response.data.lessons.filter(l => l.completed).map(l => l.lessonId));
            }
        } catch (error) {
            // No lesson progress available
        }
    };

    const markLessonComplete = async (lessonId) => {
        try {
            const response = await userAPI.post(`/api/users/lessons/${lessonId}/complete`);
            if (response.data.success) {
                // Update local state immediately for instant feedback
                setCompletedLessons(prev => [...prev, lessonId]);
                toast.success('Lesson marked as complete!');
                
                // Refresh data
                loadLessonProgress();
                checkExamEligibility();
            }
        } catch (error) {
            toast.error('Failed to mark lesson as complete');
        }
    };

    const handleLessonSelect = (lesson, index) => {
        // Check if lesson is published
        if (!lesson.isPublished) {
            toast.info('This lesson is not yet available. The instructor is still preparing the content.');
            return;
        }

        setCurrentLesson(lesson);
        setCurrentLessonIndex(index);
        setVideoLoading(true);

        // Auto-hide loading after 1.5 seconds max
        setTimeout(() => {
            setVideoLoading(false);
        }, 1500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Course not found</h2>
                        <button
                            onClick={() => navigate('/user/my-courses')}
                            className="text-teal-600 hover:text-teal-700"
                        >
                            Back to My Courses
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 video-protection">
            <Header />

            <div className="flex min-h-screen">
                {/* Sidebar - Lessons List */}
                <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto max-h-screen">
                    {/* Course Header */}
                    <div className="p-4 border-b border-gray-200">
                        <button
                            onClick={() => navigate('/user/my-courses')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to My Courses
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h1>
                        <p className="text-sm text-gray-600">
                            By {course.tutor?.full_name || 'Unknown Instructor'}
                        </p>
                    </div>

                    {/* Lessons List */}
                    <div className="p-4">
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Lessons ({lessons.filter(l => l.isPublished).length}/{lessons.length})
                                </h3>
                                <span className="text-xs text-gray-500 font-medium">
                                    {completedLessons.length}/{Math.max(1, lessons.filter(l => l.isPublished).length)} completed
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 lesson-progress-bar">
                                    <div 
                                        className={`h-2 rounded-full lesson-progress-fill ${
                                            lessons.filter(l => l.isPublished).length > 0 ? 'bg-green-500' : 'bg-gray-400'
                                        }`}
                                        style={{ 
                                            width: lessons.filter(l => l.isPublished).length > 0 
                                                ? `${Math.min(100, Math.max(0, (completedLessons.length / lessons.filter(l => l.isPublished).length) * 100))}%`
                                                : '0%'
                                        }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-600 font-semibold min-w-[35px] text-right">
                                    {lessons.filter(l => l.isPublished).length > 0 
                                        ? `${Math.round((completedLessons.length / lessons.filter(l => l.isPublished).length) * 100)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                        </div>

                        {lessons.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 mb-2">No lessons available yet</p>
                                <p className="text-xs text-gray-400">The instructor is still preparing the content</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {lessons.map((lesson, index) => (
                                    <div
                                        key={lesson._id}
                                        onClick={() => lesson.isPublished ? handleLessonSelect(lesson, index) : null}
                                        className={`p-3 rounded-lg border transition-all relative ${
                                            !lesson.isPublished 
                                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60' 
                                                : currentLesson?._id === lesson._id
                                                    ? 'bg-teal-50 border-teal-200 shadow-sm cursor-pointer'
                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
                                        }`}
                                    >
                                        {/* Blur overlay for unpublished lessons */}
                                        {!lesson.isPublished && (
                                            <div className="absolute inset-0 bg-white bg-opacity-50 lesson-blur-overlay rounded-lg flex items-center justify-center z-10">
                                                <div className="text-center coming-soon-pulse">
                                                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium">Unavailabe</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                !lesson.isPublished
                                                    ? 'bg-gray-300 text-gray-500'
                                                    : currentLesson?._id === lesson._id
                                                        ? 'bg-teal-600 text-white'
                                                        : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                <Play className="w-3 h-3" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-medium ${
                                                    !lesson.isPublished
                                                        ? 'text-gray-500'
                                                        : currentLesson?._id === lesson._id
                                                            ? 'text-teal-900'
                                                            : 'text-gray-900'
                                                }`}>
                                                    Lesson {index + 1}: {lesson.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <span className="text-xs text-gray-500">
                                                        {lesson.duration || 'N/A'}
                                                    </span>
                                                    {!lesson.isPublished && (
                                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                                            Unpublished
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Completion Status */}
                                            <div className="flex-shrink-0">
                                                {!lesson.isPublished ? (
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center opacity-50">
                                                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                ) : completedLessons.includes(lesson._id) ? (
                                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Exam Section */}
                        {checkingExam && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Course Exam
                                </h3>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                        <span className="text-sm text-gray-600">Checking exam availability...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {!checkingExam && examEligibility && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Course Exam
                                </h3>
                                
                                {examEligibility.eligible ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-800">
                                                Ready to take exam!
                                            </span>
                                        </div>
                                        <p className="text-xs text-green-700 mb-3">
                                            You've completed all required lessons. Take the exam to earn your certificate.
                                        </p>
                                        <button
                                            onClick={() => navigate(`/user/course/${courseId}/exam`)}
                                            className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                        >
                                            Take Exam
                                        </button>
                                        {examEligibility.attemptsRemaining && (
                                            <p className="text-xs text-green-600 mt-2 text-center">
                                                {examEligibility.attemptsRemaining} attempts remaining
                                            </p>
                                        )}
                                    </div>
                                ) : examEligibility.attemptsExhausted ? (
                                    <div className={`${examEligibility.examInfo?.hasPassed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {examEligibility.examInfo?.hasPassed ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Award className="w-4 h-4 text-blue-600" />
                                            )}
                                            <span className={`text-sm font-medium ${examEligibility.examInfo?.hasPassed ? 'text-green-800' : 'text-blue-800'}`}>
                                                {examEligibility.examInfo?.hasPassed ? 'Exam Passed!' : 'Attempts Completed'}
                                            </span>
                                        </div>
                                        <p className={`text-xs mb-3 ${examEligibility.examInfo?.hasPassed ? 'text-green-700' : 'text-blue-700'}`}>
                                            {examEligibility.message}
                                        </p>
                                        {examEligibility.examInfo?.bestScore && (
                                            <div className="text-xs mb-3">
                                                <span className="font-medium">Best Score: </span>
                                                <span className={`font-bold ${examEligibility.examInfo.hasPassed ? 'text-green-600' : 'text-red-600'}`}>
                                                    {examEligibility.examInfo.bestScore}%
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => navigate(`/user/course/${courseId}/exam`)}
                                            className={`w-full px-3 py-2 text-white text-sm rounded transition-colors ${
                                                examEligibility.examInfo?.hasPassed 
                                                    ? 'bg-green-600 hover:bg-green-700' 
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            {examEligibility.examInfo?.hasPassed ? 'View Results & Certificate' : 'View Attempt History'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-yellow-600" />
                                            <span className="text-sm font-medium text-yellow-800">
                                                Exam Locked
                                            </span>
                                        </div>
                                        <p className="text-xs text-yellow-700 mb-2">
                                            {examEligibility.message || 'Complete all required lessons to unlock the exam.'}
                                        </p>
                                        {examEligibility.requirements && (
                                            <ul className="text-xs text-yellow-700 space-y-1">
                                                {examEligibility.requirements.map((req, index) => (
                                                    <li key={index}>• {req}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {!checkingExam && !examEligibility && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Course Exam
                                </h3>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">No exam available for this course</p>
                                    <p className="text-xs text-gray-500 mt-1">Course ID: {courseId}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {currentLesson ? (
                        <>
                            {/* Video Player */}
                            <div
                                className="bg-black relative h-100 lg:h-150 xl:h-[600px] video-container"
                                style={{
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    MozUserSelect: 'none',
                                    msUserSelect: 'none',
                                    WebkitTouchCallout: 'none',
                                    WebkitUserDrag: 'none',
                                    KhtmlUserSelect: 'none'
                                }}
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                            >
                                {videoLoading ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                            <p className="text-gray-300">Loading lesson...</p>
                                        </div>
                                    </div>
                                ) : currentLesson.videoUrl ? (
                                    <>
                                        <video
                                            key={currentLesson._id} // Force re-render when lesson changes
                                            className="w-full h-full object-contain"
                                            controls
                                            poster={currentLesson.thumbnailUrl || course.course_thumbnail}
                                            controlsList="nodownload noremoteplayback nofullscreen"
                                            disablePictureInPicture
                                            disableRemotePlayback
                                            onContextMenu={(e) => e.preventDefault()}
                                            onDragStart={(e) => e.preventDefault()}
                                            onCanPlay={() => setVideoLoading(false)}
                                            onError={() => setVideoLoading(false)}
                                            onLoadStart={() => {
                                                // Prevent video URL inspection
                                                const video = document.querySelector('video');
                                                if (video) {
                                                    video.addEventListener('loadedmetadata', () => {
                                                        // Clear browser cache for this video
                                                        video.preload = 'none';
                                                    });
                                                }
                                            }}
                                            style={{
                                                userSelect: 'none',
                                                WebkitUserSelect: 'none',
                                                pointerEvents: 'auto',
                                                outline: 'none'
                                            }}
                                            // Additional security attributes
                                            crossOrigin="anonymous"
                                            playsInline
                                        >
                                            <source src={currentLesson.videoUrl} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>

                                        {/* Subtle Watermark Overlay */}
                                        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                                            <div className="absolute top-4 right-4 text-white text-xs opacity-20 bg-black bg-opacity-30 px-2 py-1 rounded">
                                                Scholaro - Licensed Content
                                            </div>
                                            <div className="absolute bottom-4 left-4 text-white text-xs opacity-20 bg-black bg-opacity-30 px-2 py-1 rounded">
                                                User: {course.title}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                                            <h3 className="text-xl font-medium mb-2">{currentLesson.title}</h3>
                                            <p className="text-gray-300">No video available for this lesson</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lesson Info */}
                            <div className="bg-white border-b border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                            {currentLesson.title}
                                        </h2>
                                        <p className="text-gray-600">
                                            Lesson {currentLessonIndex + 1} of {lessons.length}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {!currentLesson.isPublished ? (
                                            <button
                                                disabled
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg opacity-75 cursor-not-allowed"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                                Unavailable
                                            </button>
                                        ) : completedLessons.includes(currentLesson._id) ? (
                                            <button
                                                disabled
                                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg opacity-75 cursor-not-allowed"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Completed ✓
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => markLessonComplete(currentLesson._id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Mark Complete
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate('/user/chat')}
                                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Chat with Tutor
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Lesson Description */}
                            <div className="flex-1 bg-gray-50 p-6">
                                <div className="bg-white rounded-lg p-6">
                                    {!currentLesson.isPublished && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-medium text-yellow-800">Lesson Not Available</span>
                                            </div>
                                            <p className="text-sm text-yellow-700">
                                                This lesson is currently being prepared by the instructor and is not yet available for viewing. 
                                                You'll be notified when it becomes available.
                                            </p>
                                        </div>
                                    )}
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About this lesson</h3>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        {currentLesson.description || 'No description available for this lesson.'}
                                    </p>

                                    {/* PDF Materials Section */}
                                    {currentLesson.pdfUrl && currentLesson.isPublished && (
                                        <div className="border-t border-gray-200 pt-6">
                                            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                </svg>
                                                Lesson Materials
                                            </h4>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-medium text-gray-900">Lesson Notes & Materials</h5>
                                                            <p className="text-sm text-gray-500">PDF Document - Study materials for this lesson</p>
                                                        </div>
                                                    </div>
                                                    <PDFViewer
                                                        pdfUrl={currentLesson.pdfUrl}
                                                        title={`${currentLesson.title} - Lesson Materials`}
                                                        filename={`${currentLesson.title}_notes.pdf`}
                                                        size="sm"
                                                    />
                                                </div>

                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                {lessons.length === 0 ? (
                                    <>
                                        <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">No lessons available yet</h2>
                                        <p className="text-gray-600">The instructor is still preparing the course content</p>
                                    </>
                                ) : lessons.every(lesson => !lesson.isPublished) ? (
                                    <>
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Lessons are being prepared</h2>
                                        <p className="text-gray-600 mb-4">All lessons are currently unpublished. The instructor is working on making them available.</p>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                                            <p className="text-sm text-blue-800">
                                                <strong>What does this mean?</strong><br />
                                                The instructor is still finalizing the lesson content. You'll be notified when lessons become available.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select a lesson to start learning</h2>
                                        <p className="text-gray-600">Choose a published lesson from the sidebar to begin</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseLearning;