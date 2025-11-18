import { useState, useEffect } from 'react';
import { BookOpen, Eye, EyeOff, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import TutorLayout from './COMMON/TutorLayout';
import { tutorAPI } from '../../api/axiosConfig';

const Lessons = () => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadLessons();
    }, [page]);

    const loadLessons = async () => {
        try {
            setLoading(true);
            const response = await tutorAPI.get(`/all-lessons?page=${page}&limit=20`);
            setLessons(response.data.lessons);
            setTotalPages(response.data.pages);
        } catch (error) {
            toast.error('Failed to load lessons');
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async (lessonId, currentStatus) => {
        try {
            await tutorAPI.patch(`/lessons/${lessonId}/toggle-publish`);
            setLessons(prev => prev.map(lesson =>
                lesson._id === lessonId
                    ? { ...lesson, isPublished: !currentStatus }
                    : lesson
            ));
            toast.success(`Lesson ${!currentStatus ? 'published' : 'unpublished'} successfully`);
        } catch (error) {
            toast.error('Failed to update lesson status');
        }
    };

    if (loading) {
        return (
            <TutorLayout title="All Lessons" subtitle="Manage your lessons">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                </div>
            </TutorLayout>
        );
    }

    return (
        <TutorLayout title="All Lessons" subtitle="Manage your lessons">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lesson
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Course
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lessons.map((lesson) => (
                                <tr key={lesson._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {lesson.title}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Order: {lesson.order}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {lesson.course?.title || 'Unknown Course'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lesson.isPublished
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {lesson.isPublished ? 'Published' : 'Unpublished'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => togglePublish(lesson._id, lesson.isPublished)}
                                            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${lesson.isPublished
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {lesson.isPublished ? (
                                                <>
                                                    <EyeOff className="h-4 w-4 mr-1" />
                                                    Unpublish
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Publish
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {lessons.length === 0 && (
                    <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No lessons found</p>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 bg-teal-500 text-white rounded">
                                {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </TutorLayout>
    );
};

export default Lessons;