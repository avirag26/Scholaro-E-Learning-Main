import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Upload, X, Play, FileText, Plus } from "lucide-react";
import TutorLayout from "./COMMON/TutorLayout";
import Swal from "sweetalert2";
import ImageUpload from "../../components/ImageUpload";
import { 
  uploadToCloudinary, 
  uploadVideoToCloudinary, 
  uploadDocumentToCloudinary,
  validateImageFile, 
  validateVideoFile, 
  validatePdfFile 
} from "../../utils/cloudinary";
import {
  createLesson,
  fetchCourseLessons,
  deleteLesson,
  updateLesson,
  clearError
} from "../../Redux/lessonSlice";
const AddLesson = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { lessons, courseInfo, loading, error } = useSelector((state) => state.lessons);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    videoFile: null,
    pdfFile: null,
    thumbnailFile: null
  });
  const [videoPreview, setVideoPreview] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploading, setUploading] = useState({
    video: false,
    pdf: false,
    thumbnail: false
  });
  const [dragActive, setDragActive] = useState({
    video: false,
    pdf: false,
    thumbnail: false
  });
  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseLessons(courseId));
    }
  }, [dispatch, courseId]);
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleVideoUpload = async (file) => {
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    setUploading(prev => ({ ...prev, video: true }));
    try {
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
      const uploadResult = await uploadVideoToCloudinary(file);
      if (uploadResult.success) {
        setFormData(prev => ({
          ...prev,
          videoFile: uploadResult.url,
          duration: uploadResult.duration ? `${Math.floor(uploadResult.duration / 60)}:${Math.floor(uploadResult.duration % 60).toString().padStart(2, '0')} minutes` : prev.duration
        }));
        toast.success("Video uploaded successfully!");
      } else {
        toast.error(uploadResult.error);
        setVideoPreview(null);
      }
    } catch (error) {
      toast.error("Failed to upload video");
      setVideoPreview(null);
    } finally {
      setUploading(prev => ({ ...prev, video: false }));
    }
  };
  const handlePdfUpload = async (file) => {
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    setUploading(prev => ({ ...prev, pdf: true }));
    try {
      setPdfPreview(file.name);
      const uploadResult = await uploadDocumentToCloudinary(file);
      if (uploadResult.success) {
        setFormData(prev => ({
          ...prev,
          pdfFile: uploadResult.url
        }));
        toast.success("PDF uploaded successfully!");
      } else {
        toast.error(uploadResult.error);
        setPdfPreview(null);
      }
    } catch (error) {
      toast.error("Failed to upload PDF");
      setPdfPreview(null);
    } finally {
      setUploading(prev => ({ ...prev, pdf: false }));
    }
  };
  const handleThumbnailUpload = (croppedImageUrl) => {
    setFormData(prev => ({
      ...prev,
      thumbnailFile: croppedImageUrl
    }));
    setThumbnailPreview(croppedImageUrl);
    toast.success("Thumbnail uploaded successfully!");
  };
  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };
  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (type === 'video') {
        handleVideoUpload(file);
      } else if (type === 'pdf') {
        handlePdfUpload(file);
      }
    }
  };
  const handleFileChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'video') {
        handleVideoUpload(file);
      } else if (type === 'pdf') {
        handlePdfUpload(file);
      }
    }
  };
  const removeFile = (type) => {
    if (type === 'video') {
      setVideoPreview(null);
      setFormData(prev => ({ ...prev, videoFile: null }));
    } else if (type === 'pdf') {
      setPdfPreview(null);
      setFormData(prev => ({ ...prev, pdfFile: null }));
    } else if (type === 'thumbnail') {
      setThumbnailPreview(null);
      setFormData(prev => ({ ...prev, thumbnailFile: null }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Lesson description is required");
      return;
    }
    if (!courseId) {
      toast.error("Course ID is required");
      return;
    }
    try {
      const lessonData = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        videoUrl: formData.videoFile,
        thumbnailUrl: formData.thumbnailFile,
        pdfUrl: formData.pdfFile
      };
      const result = await dispatch(createLesson({ courseId, lessonData }));
      if (createLesson.fulfilled.match(result)) {
        setFormData({
          title: "",
          description: "",
          duration: "",
          videoFile: null,
          pdfFile: null,
          thumbnailFile: null
        });
        setVideoPreview(null);
        setPdfPreview(null);
        setThumbnailPreview(null);
        toast.success("Lesson added successfully!");
      }
    } catch (error) {
     console.log(error)
    }
  };
  const handleDeleteLesson = async (lessonId) => {
    const result = await Swal.fire({
      title: "Delete Lesson?",
      text: "Are you sure you want to delete this lesson? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    try {
      const result = await dispatch(deleteLesson(lessonId));
      if (deleteLesson.fulfilled.match(result)) {
        toast.success("Lesson deleted successfully!");
      }
    } catch (error) {
      console.log(error)
    }
  };
  return (
    <TutorLayout 
      title="Add New Lesson" 
      subtitle="Create engaging lessons for your course"
    >
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {}
          <div className="bg-green-50 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Add New Lesson
              {courseInfo && (
                <span className="block text-lg font-normal text-gray-600 mt-1">
                  for "{courseInfo.title}"
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {}
              <div className="space-y-4">
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors bg-green-50"
                    placeholder="Enter lesson title"
                    required
                  />
                </div>
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors resize-none bg-green-50"
                    placeholder="Enter detailed lesson description"
                    required
                  />
                </div>
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors bg-green-50"
                    placeholder="e.g., 15:30 minutes or 1:20 hours"
                  />
                </div>
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Video
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${uploading.video
                      ? 'border-gray-200 cursor-not-allowed bg-gray-50'
                      : dragActive.video
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-300 hover:border-teal-400 bg-white'
                      }`}
                    onDragEnter={!uploading.video ? (e) => handleDrag(e, 'video') : undefined}
                    onDragLeave={!uploading.video ? (e) => handleDrag(e, 'video') : undefined}
                    onDragOver={!uploading.video ? (e) => handleDrag(e, 'video') : undefined}
                    onDrop={!uploading.video ? (e) => handleDrop(e, 'video') : undefined}
                  >
                    {videoPreview ? (
                      <div className="relative">
                        <video
                          src={videoPreview}
                          className="w-full h-32 object-cover rounded-lg"
                          controls
                        />
                        <button
                          type="button"
                          onClick={() => removeFile('video')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {uploading.video ? (
                          <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                            <div>
                              <p className="text-teal-600 font-medium">Uploading video...</p>
                              <p className="text-gray-500 text-sm mt-1">Please wait</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Play className="w-12 h-12 text-teal-500 mx-auto" />
                            <div>
                              <p className="text-teal-600 font-medium">Upload Video</p>
                              <p className="text-gray-500 text-sm mt-1">Drag your video file here</p>
                            </div>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => handleFileChange(e, 'video')}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={uploading.video}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {}
              <div className="space-y-4">
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload PDF notes
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors min-h-[200px] flex flex-col justify-center ${uploading.pdf
                      ? 'border-gray-200 cursor-not-allowed bg-gray-50'
                      : dragActive.pdf
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-300 hover:border-teal-400 bg-white'
                      }`}
                    onDragEnter={!uploading.pdf ? (e) => handleDrag(e, 'pdf') : undefined}
                    onDragLeave={!uploading.pdf ? (e) => handleDrag(e, 'pdf') : undefined}
                    onDragOver={!uploading.pdf ? (e) => handleDrag(e, 'pdf') : undefined}
                    onDrop={!uploading.pdf ? (e) => handleDrop(e, 'pdf') : undefined}
                  >
                    {pdfPreview ? (
                      <div className="relative">
                        <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
                          <FileText className="w-12 h-12 text-red-500 mr-3" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{pdfPreview}</p>
                            <p className="text-sm text-gray-500">PDF Document</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('pdf')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {uploading.pdf ? (
                          <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                            <div>
                              <p className="text-teal-600 font-medium">Uploading PDF...</p>
                              <p className="text-gray-500 text-sm mt-1">Please wait</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-teal-500 mx-auto" />
                            <div>
                              <p className="text-teal-600 font-medium">Upload Thumbnail/Notes</p>
                              <p className="text-gray-500 text-sm mt-1">Drag your PDF file here or click to browse</p>
                            </div>
                            <button
                              type="button"
                              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                              onClick={() => document.getElementById('pdf-input').click()}
                            >
                              + Add
                            </button>
                            <input
                              id="pdf-input"
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleFileChange(e, 'pdf')}
                              className="hidden"
                              disabled={uploading.pdf}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Thumbnail
                  </label>
                  <ImageUpload
                    currentImage={thumbnailPreview}
                    onImageUpload={handleThumbnailUpload}
                    title="Upload Thumbnail"
                    uploadFolder="lesson-thumbnails"
                    placeholder="Upload thumbnail image"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            {}
            <div className="mt-8 text-center">
              <button
                type="submit"
                disabled={loading || uploading.video || uploading.pdf || uploading.thumbnail}
                className="px-12 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {loading ? "Adding..." : "? Add Lesson"}
              </button>
            </div>
          </div>
          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Lessons</h3>
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <img
                      src={lesson.thumbnailUrl || '/api/placeholder/100/60'}
                      alt={lesson.title}
                      className="w-16 h-10 object-cover rounded"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/100/60';
                      }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                      <p className="text-sm text-gray-500">{lesson.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      Duration: {lesson.duration || 'Not set'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lesson.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lesson.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      Remove
                    </button>
                    <button 
                      onClick={() => navigate(`/tutor/edit-lesson/${lesson.id}`)}
                      className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm"
                    >
                      Edit Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {}
            <div className="mt-8 text-center">
              <button
                type="button"
                className="px-12 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-lg"
                onClick={() =>{navigate('/tutor/courses'), toast.success("Course lessons submitted successfully!")}}
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </TutorLayout>
  );
};
export default AddLesson;
