import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, BookOpen, Clock, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import { userAPI } from '../../api/axiosConfig';
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

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    useEffect(() => {
        if (lessons.length > 0 && !currentLesson) {
            setCurrentLesson(lessons[0]);
            setCurrentLessonIndex(0);
            setVideoLoading(false); // Ensure loading is false for first lesson
        }
    }, [lessons, currentLesson]);

    // Screen recording and screenshot protection
    useEffect(() => {
        // Disable right-click context menu
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        // Disable keyboard shortcuts for screenshots and dev tools
        const handleKeyDown = (e) => {
            // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Print Screen
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

        // Disable text selection
        const handleSelectStart = (e) => {
            e.preventDefault();
            return false;
        };

        // Disable drag and drop
        const handleDragStart = (e) => {
            e.preventDefault();
            return false;
        };

        // Add event listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('dragstart', handleDragStart);

        // Screen recording detection (basic)
        const detectScreenRecording = () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                // Screen recording capabilities detected
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

    const handleLessonSelect = (lesson, index) => {
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
                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Lessons ({lessons.length})
                        </h3>

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
                                        onClick={() => handleLessonSelect(lesson, index)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${currentLesson?._id === lesson._id
                                            ? 'bg-teal-50 border-teal-200 shadow-sm'
                                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${currentLesson?._id === lesson._id
                                                ? 'bg-teal-600 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                <Play className="w-3 h-3" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-medium ${currentLesson?._id === lesson._id
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
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                onSelectStart={(e) => e.preventDefault()}
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
                                            controlsList="nodownload noremoteplayback"
                                            disablePictureInPicture
                                            disableRemotePlayback
                                            onContextMenu={(e) => e.preventDefault()}
                                            onDragStart={(e) => e.preventDefault()}
                                            onCanPlay={() => setVideoLoading(false)}
                                            onError={() => setVideoLoading(false)}
                                            style={{
                                                userSelect: 'none',
                                                WebkitUserSelect: 'none',
                                                pointerEvents: 'auto'
                                            }}
                                        >
                                            <source src={currentLesson.videoUrl} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>

                                        {/* Watermark Overlay */}
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                background: `
                                                    repeating-linear-gradient(
                                                        45deg,
                                                        transparent,
                                                        transparent 100px,
                                                        rgba(255,255,255,0.05) 100px,
                                                        rgba(255,255,255,0.05) 120px
                                                    )
                                                `,
                                                zIndex: 10
                                            }}
                                        >
                                            <div className="absolute top-4 right-4 text-white text-xs opacity-30">
                                                © Scholaro - Licensed Content
                                            </div>
                                            <div className="absolute bottom-4 left-4 text-white text-xs opacity-30">
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
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About this lesson</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {currentLesson.description || 'No description available for this lesson.'}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Play className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select a lesson to start learning</h2>
                                <p className="text-gray-600">Choose a lesson from the sidebar to begin</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseLearning;