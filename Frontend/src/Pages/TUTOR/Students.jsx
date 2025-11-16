import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    MessageCircle,
    BookOpen,
    Search,
    Mail,
    Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';
import TutorLayout from './COMMON/TutorLayout';
import Loading from '../../ui/Loading';
import { createOrGetChatByTutor } from '../../Redux/chatSlice';
import { tutorAPI } from '../../api/axiosConfig';

const Students = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [chatLoading, setChatLoading] = useState({});

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await tutorAPI.get('/api/tutors/students');
            if (response.data.success) {
                setStudents(response.data.students);
            }
        } catch (error) {
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = async (studentId) => {
        try {
            setChatLoading(prev => ({ ...prev, [studentId]: true }));
            await dispatch(createOrGetChatByTutor({ studentId })).unwrap();
            navigate('/tutor/chat');
            toast.success('Chat started successfully');
        } catch (error) {
            toast.error(error || 'Failed to start chat');
        } finally {
            setChatLoading(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <Loading />;
    }

    return (
        <TutorLayout>
            <div className="p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Students</h1>
                    <p className="text-gray-600">
                        Students who have enrolled in your courses
                    </p>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Students List */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchTerm ? 'No students found' : 'No students yet'}
                            </h3>
                            <p className="text-gray-600">
                                {searchTerm
                                    ? 'Try adjusting your search terms.'
                                    : 'Students will appear here when they enroll in your courses.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                                <div key={student._id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {/* Student Avatar */}
                                            <img
                                                src={student.profileImage || '/default-avatar.png'}
                                                alt={student.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />

                                            {/* Student Info */}
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {student.name}
                                                </h3>
                                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                                    <Mail className="w-4 h-4 mr-1" />
                                                    {student.email}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                                    <BookOpen className="w-4 h-4 mr-1" />
                                                    {student.courses.length} course{student.courses.length !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleStartChat(student._id)}
                                                disabled={chatLoading[student._id]}
                                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {chatLoading[student._id] ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                ) : (
                                                    <MessageCircle className="w-4 h-4" />
                                                )}
                                                {chatLoading[student._id] ? 'Starting...' : 'Start Chat'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Enrolled Courses */}
                                    {student.courses.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Enrolled Courses:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {student.courses.map((course) => (
                                                    <span
                                                        key={course._id}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                                                    >
                                                        {course.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </TutorLayout>
    );
};

export default Students;