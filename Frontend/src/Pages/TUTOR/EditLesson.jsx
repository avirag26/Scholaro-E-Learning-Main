import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Upload, X, Play, FileText } from "lucide-react";
import TutorLayout from "./COMMON/TutorLayout";
import { 
  uploadToCloudinary, 
  uploadVideoToCloudinary, 
  uploadDocumentToCloudinary,
  validateImageFile, 
  validateVideoFile, 
  validatePdfFile 
} from "../../utils/cloudinary";
import {
  updateLesson,
  fetchLessonDetails,
  clearError
} from "../../Redux/lessonSlice";

const EditLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedLesson, loading, error } = useSelector((state) => state.lessons);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    videoUrl: "",
    pdfUrl: "",
    thumbnailUrl: ""
  });

  const [videoPreview, setVideoPreview] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploading, setUploading] = useState({
    video: false,
    pdf: false,
    thumbnail: false
  });

  // Fetch lesson details on mount
  useEffect(() => {
    if (lessonId) {
      dispatch(fetchLessonDetails(lessonId));
    }
  }, [dispatch, lessonId]);

  // Populate form when lesson data is loaded
  useEffect(() => {
    if (selectedLesson) {
      setFormData({
        title: selectedLesson.title || "",
        description: selectedLesson.description || "",
        duration: selectedLesson.duration || "",
        videoUrl: selectedLesson.videoUrl || "",
        pdfUrl: selectedLesson.pdfUrl || "",
        thumbnailUrl: selectedLesson.thumbnailUrl || ""
      });
      
      // Set previews
      if (selectedLesson.videoUrl) {
        setVideoPreview(selectedLesson.videoUrl);
      }
      if (selectedLesson.pdfUrl) {
        setPdfPreview("Existing PDF");
      }
      if (selectedLesson.thumbnailUrl) {
        setThumbnailPreview(selectedLesson.thumbnailUrl);
      }
    }
  }, [selectedLesson]);

  // Handle Redux errors
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

  // Video upload handler
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setUploading(prev => ({ ...prev, video: true }));
    try {
      const uploadResult = await uploadVideoToCloudinary(file, 'lesson-videos');
      
      if (uploadResult.success) {
        setFormData(prev => ({
          ...prev,
          videoUrl: uploadResult.url
        }));
        setVideoPreview(uploadResult.url);
        toast.success("Video uploaded successfully!");
      } else {
        toast.error(uploadResult.error || "Failed to upload video");
      }
    } catch (error) {
      toast.error("Failed to upload video");
    } finally {
      setUploading(prev => ({ ...prev, video: false }));
    }
  };

  // PDF upload handler
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validatePdfFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setUploading(prev => ({ ...prev, pdf: true }));
    try {
      const uploadResult = await uploadDocumentToCloudinary(file, 'lesson-pdfs');
      
      if (uploadResult.success) {
        setFormData(prev => ({
          ...prev,
          pdfUrl: uploadResult.url
        }));
        setPdfPreview(file.name);
        toast.success("PDF uploaded successfully!");
      } else {
        toast.error(uploadResult.error || "Failed to upload PDF");
      }
    } catch (error) {
      toast.error("Failed to upload PDF");
    } finally {
      setUploading(prev => ({ ...prev, pdf: false }));
    }
  };

  // Thumbnail upload handler
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setUploading(prev => ({ ...prev, thumbnail: true }));
    try {
      const uploadResult = await uploadToCloudinary(file, 'lesson-thumbnails');
      
      if (uploadResult.success) {
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: uploadResult.url
        }));
        setThumbnailPreview(uploadResult.url);
        toast.success("Thumbnail uploaded successfully!");
      } else {
        toast.error(uploadResult.error || "Failed to upload thumbnail");
      }
    } catch (error) {
      toast.error("Failed to upload thumbnail");
    } finally {
      setUploading(prev => ({ ...prev, thumbnail: false }));
    }
  };

  const removeVideo = () => {
    setVideoPreview(null);
    setFormData(prev => ({ ...prev, videoUrl: "" }));
  };

  const removePdf = () => {
    setPdfPreview(null);
    setFormData(prev => ({ ...prev, pdfUrl: "" }));
  };

  const removeThumbnail = () => {
    setThumbnailPreview(null);
    setFormData(prev => ({ ...prev, thumbnailUrl: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Lesson description is required");
      return;
    }

    try {
      const lessonData = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl,
        pdfUrl: formData.pdfUrl
      };

      const result = await dispatch(updateLesson({ lessonId, lessonData }));
      
      if (updateLesson.fulfilled.match(result)) {
        toast.success("Lesson updated successfully!");
        setTimeout(() => {
          navigate(-1); // Go back to previous page
        }, 1000);
      } else {
        toast.error(result.payload || "Failed to update lesson");
      }
    } catch (error) {
      toast.error("Failed to update lesson");
    }
  };

  if (loading && !selectedLesson) {
    return (
      <TutorLayout title="Edit Lesson" subtitle="Loading lesson details...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </TutorLayout>
    );
  }

  return (
    <TutorLayout title="Edit Lesson" subtitle="Update your lesson content">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Edit Lesson
            </h2>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                  placeholder="Enter lesson title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                  placeholder="Enter duration in minutes"
                  min="1"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors resize-none"
                placeholder="Enter lesson description"
                required
              />
            </div>

            {/* Video Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Video
              </label>
              {videoPreview ? (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                  <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload lesson video</p>
                  <p className="text-sm text-gray-500">MP4, WebM up to 100MB</p>
                </div>
              )}
              
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                disabled={uploading.video}
              />
              
              {uploading.video && (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2"></div>
                  <span className="text-teal-600">Uploading video...</span>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Thumbnail
              </label>
              {thumbnailPreview ? (
                <div className="relative inline-block">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload thumbnail image</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                disabled={uploading.thumbnail}
              />
              
              {uploading.thumbnail && (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2"></div>
                  <span className="text-teal-600">Uploading thumbnail...</span>
                </div>
              )}
            </div>

            {/* PDF Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF Notes (Optional)
              </label>
              {pdfPreview ? (
                <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-red-500" />
                    <span className="text-gray-700">{pdfPreview}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removePdf}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload PDF notes</p>
                  <p className="text-sm text-gray-500">PDF up to 10MB</p>
                </div>
              )}
              
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                disabled={uploading.pdf}
              />
              
              {uploading.pdf && (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2"></div>
                  <span className="text-teal-600">Uploading PDF...</span>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploading.video || uploading.pdf || uploading.thumbnail}
                className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "🔄 UPDATE LESSON"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </TutorLayout>
  );
};

export default EditLesson;