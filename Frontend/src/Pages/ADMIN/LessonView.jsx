import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Video,
  FileText,
  Clock,
  Users,
  Calendar,
  Play,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import PDFViewer from '../../components/PDFViewer';
import { toast } from 'react-toastify';
import AdminLayout from './common/AdminLayout';
import { adminAPI } from '../../api/axiosConfig';

const AdminLessonView = () => {
  const { lessonId, courseId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLessonDetails();
  }, [lessonId]);

  const fetchLessonDetails = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get(`/api/admin/lessons/${lessonId}/details`);
      if (response.data.success) {
        setLesson(response.data.lesson);
      } else {
        toast.error('Failed to load lesson details');
        navigate(-1);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/admin/login');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. You do not have permission to view this lesson.');
        navigate(-1);
      } else {
        toast.error(error.response?.data?.message || 'Failed to load lesson details');
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLessonPublish = async () => {
    setActionLoading(true);
    try {
      const response = await adminAPI.patch(`/api/admin/lessons/${lessonId}/toggle-publish`);
      if (response.data.success) {
        setLesson(prev => ({ ...prev, isPublished: !prev.isPublished }));
        toast.success(`Lesson ${!lesson.isPublished ? 'published' : 'unpublished'} successfully`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lesson status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackNavigation = () => {
    if (courseId) {
      navigate(`/admin/courses/${courseId}/details`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Lesson Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!lesson) {
    return (
      <AdminLayout title="Lesson Details">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson not found</h2>
          <p className="text-gray-600 mb-4">The lesson you're looking for doesn't exist or is not available.</p>
          <button
            onClick={handleBackNavigation}
            className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Lesson Details" subtitle={`Viewing: ${lesson.title}`}>
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {courseId ? 'Back to Course' : 'Go Back'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Lesson Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${lesson.isPublished
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {lesson.isPublished ? 'Published' : 'Unpublished'}
                </span>
                <span className="text-sm text-gray-500">
                  Order: {lesson.order || 0}
                </span>
                
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {lesson.title}
              </h1>
              <p className="text-gray-600 text-xl leading-relaxed">
                {lesson.description || 'No description available'}
              </p>
            </div>

            {/* Course Info */}
            {lesson.course && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
                <div className="flex items-center gap-6">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {lesson.course.title}
                    </h4>
                    <p className="text-gray-600 mb-2">{lesson.course.description}</p>
                    {lesson.course.tutor && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Instructor: {lesson.course.tutor.full_name}</span>
                        <span>•</span>
                        <span>{lesson.course.tutor.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Content */}
          {lesson.videoUrl && (
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Video Content</h2>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <video
                  controls
                  className="w-full rounded-lg"
                  style={{ maxHeight: '500px' }}
                  poster={lesson.thumbnailUrl}
                >
                  <source src={lesson.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* PDF Content */}
          {/* {lesson.pdfUrl && (
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">PDF Material</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Lesson Material</h3>
                      <p className="text-sm text-gray-500">PDF Document</p>
                    </div>
                  </div>
                  <PDFViewer
                    pdfUrl={lesson.pdfUrl}
                    title={`${lesson.title} - Admin View`}
                    filename={`${lesson.title}_lesson_material.pdf`}
                    size="md"
                  />
                </div>


              </div>
            </div>
          )} */}

          {/* Lesson Properties */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Lesson Properties</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="text-sm text-gray-600">Duration</span>
                  <p className="font-medium text-gray-900">{lesson.duration || 'Not specified'}</p>
                </div>
              </div>
             
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className={`w-5 h-5 ${lesson.isFinalLesson ? 'text-yellow-600' : 'text-gray-400'}`}>
                  {lesson.isFinalLesson ? <CheckCircle /> : <XCircle />}
                </div>
                <div>
                  <span className="text-sm text-gray-600">Final Lesson</span>
                  <p className={`font-medium ${lesson.isFinalLesson ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {lesson.isFinalLesson ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              
            </div>
          </div>

          {/* No Content Message */}
          {!lesson.videoUrl && !lesson.pdfUrl && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Media Content Available</h3>
                <p>This lesson doesn't have video or PDF content yet.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-8">
            {/* Lesson Thumbnail */}
            <div className="relative">
              <img
                src={lesson.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop"}
                alt={lesson.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <Play className="w-16 h-16 text-white" />
              </div>
            </div>

            <div className="p-6">
              {/* Lesson Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{lesson.duration || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order</span>
                  <span className="font-semibold">{lesson.order || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">{lesson.views || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold ${lesson.isPublished ? 'text-green-600' : 'text-red-600'}`}>
                    {lesson.isPublished ? 'Published' : 'Unpublished'}
                  </span>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="space-y-3">
                <button
                  onClick={toggleLessonPublish}
                  disabled={actionLoading}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium transition-colors ${lesson.isPublished
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                    } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {lesson.isPublished ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  {actionLoading ? 'Processing...' : (lesson.isPublished ? 'Unpublish Lesson' : 'Publish Lesson')}
                </button>

                {courseId && (
                  <button
                    onClick={() => navigate(`/admin/courses/${courseId}/details`)}
                    className="w-full flex items-center justify-center gap-3 bg-blue-50 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Course
                  </button>
                )}
              </div>

              {/* Lesson Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Lesson Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(lesson.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span>{new Date(lesson.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Final Lesson:</span>
                    <span className={lesson.isFinalLesson ? 'text-yellow-600' : 'text-gray-600'}>
                      {lesson.isFinalLesson ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Required:</span>
                    <span className={lesson.isRequired ? 'text-blue-600' : 'text-gray-600'}>
                      {lesson.isRequired ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLessonView;