import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, BookOpen, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import TutorLayout from './COMMON/TutorLayout';
import FinalLessonSelector from '../../components/Tutor/Exam/FinalLessonSelector';
import { tutorAPI } from '../../api/axiosConfig';

const ExamSettings = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourseData();
    }, [courseId]);

    const loadCourseData = async () => {
        try {
            setLoading(true);

            // Load course details
            const courseResponse = await tutorAPI.get(`/api/tutors/courses/${courseId}`);
            setCourse(courseResponse.data);

            // Load course lessons
            const lessonsResponse = await tutorAPI.get(`/api/tutors/lessons/${courseId}`);
            setLessons(lessonsResponse.data.lessons || []);

        } catch (error) {
            toast.error('Failed to load course data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <TutorLayout title="Exam Settings" subtitle="Configure course completion requirements">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                </div>
            </TutorLayout>
        );
    }

    return (
        <TutorLayout title="Exam Settings" subtitle={course?.title || 'Course Settings'}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigate('/tutor/courses')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Courses
                        </button>

                        <button
                            onClick={() => navigate(`/tutor/course/${courseId}/exam`)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            <Award className="w-4 h-4" />
                            Manage Exam
                        </button>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Exam Settings
                    </h1>
                    <p className="text-gray-600">
                        Configure when students can take the exam for "{course?.title}"
                    </p>
                </div>

                {/* Course Overview */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Course Overview
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-blue-600">{Array.isArray(lessons) ? lessons.length : 0}</div>
                            <div className="text-sm text-blue-600">Total Lessons</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-green-600">
                                {Array.isArray(lessons) ? lessons.length : 0}
                            </div>
                            <div className="text-sm text-green-600">Available Lessons</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-purple-600">
                                {course?.examSettings?.isEnabled ? 'Enabled' : 'Disabled'}
                            </div>
                            <div className="text-sm text-purple-600">Exam Status</div>
                        </div>
                    </div>

                    {(!Array.isArray(lessons) || lessons.length === 0) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-yellow-800">
                                <BookOpen className="w-5 h-5" />
                                <span className="font-medium">No lessons found</span>
                            </div>
                            <p className="text-yellow-700 mt-1">
                                You need to create lessons before setting up exam requirements.
                            </p>
                            <button
                                onClick={() => navigate(`/tutor/add-lesson/${courseId}`)}
                                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                                Add Lessons
                            </button>
                        </div>
                    )}
                </div>

                {/* Final Lesson Settings */}
                {Array.isArray(lessons) && lessons.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Final Lesson & Exam Requirements
                        </h2>

                        <div className="mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-800 mb-2">How it works:</h3>
                                <ul className="text-blue-700 text-sm space-y-1">
                                    <li>• Students must complete the "final lesson" before they can take the exam</li>
                                    <li>• You can designate any lesson as the final lesson</li>
                                    <li>• Students who pass the exam (≥90%) will receive a certificate</li>
                                    <li>• All uploaded lessons are automatically available to students</li>
                                </ul>
                            </div>
                        </div>

                        <FinalLessonSelector
                            courseId={courseId}
                            lessons={lessons}
                            currentFinalLessonId={course?.examSettings?.finalLessonId}
                        />
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate(`/tutor/add-lesson/${courseId}`)}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors"
                        >
                            <BookOpen className="w-6 h-6 text-teal-600" />
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Manage Lessons</div>
                                <div className="text-sm text-gray-500">Add or edit course lessons</div>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate(`/tutor/course/${courseId}/exam`)}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                        >
                            <Award className="w-6 h-6 text-purple-600" />
                            <div className="text-left">
                                <div className="font-medium text-gray-900">Create Exam</div>
                                <div className="text-sm text-gray-500">Set up questions and exam settings</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </TutorLayout>
    );
};

export default ExamSettings;