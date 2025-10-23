import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Upload, X } from "lucide-react";
import TutorLayout from "./COMMON/TutorLayout";
import { uploadToCloudinary, validateImageFile } from "../../utils/cloudinary";
import { calculatePrice } from "../../utils/priceUtils";
import {
    updateCourse,
    fetchCourseDetails,
    fetchCategories,
    clearError
} from "../../Redux/courseSlice";

const EditCourse = () => {
    const { courseId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { categories, selectedCourse, loading, error } = useSelector((state) => state.courses);

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        description: "",
        price: "",
        offer_percentage: "",
        course_thumbnail: ""
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Fetch course details and categories on mount
    useEffect(() => {
        if (courseId) {
            dispatch(fetchCourseDetails(courseId));
        }
        dispatch(fetchCategories());
    }, [dispatch, courseId]);

    // Populate form when course data is loaded
    useEffect(() => {
        if (selectedCourse) {
            setFormData({
                title: selectedCourse.title || "",
                category: selectedCourse.category?._id || selectedCourse.category || "",
                description: selectedCourse.description || "",
                price: selectedCourse.price?.toString() || "",
                offer_percentage: selectedCourse.offer_percentage?.toString() || "",
                course_thumbnail: selectedCourse.course_thumbnail || ""
            });
            setImagePreview(selectedCourse.course_thumbnail || null);
        }
    }, [selectedCourse]);

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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.isValid) {
            toast.error(validation.error);
            return;
        }

        setUploading(true);
        try {
            const uploadResult = await uploadToCloudinary(file, 'course-thumbnails');
            
            if (uploadResult.success) {
                setFormData(prev => ({
                    ...prev,
                    course_thumbnail: uploadResult.url
                }));
                setImagePreview(uploadResult.url);
                toast.success("Image uploaded successfully!");
            } else {
                toast.error(uploadResult.error || "Failed to upload image");
            }
        } catch (error) {
            toast.error("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setFormData(prev => ({
            ...prev,
            course_thumbnail: ""
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.title.trim()) {
            toast.error("Course title is required");
            return;
        }
        if (!formData.category) {
            toast.error("Please select a category");
            return;
        }
        if (!formData.description || !formData.description.trim()) {
            toast.error("Course description is required");
            return;
        }
        if (!formData.price || formData.price <= 0) {
            toast.error("Please enter a valid price");
            return;
        }
        if (!formData.course_thumbnail) {
            toast.error("Please upload a course thumbnail");
            return;
        }

        try {
            const courseData = {
                ...formData,
                price: parseFloat(formData.price),
                offer_percentage: parseFloat(formData.offer_percentage) || 0,
            };

            const result = await dispatch(updateCourse({ id: courseId, courseData }));
            
            if (updateCourse.fulfilled.match(result)) {
                toast.success("Course updated successfully!");
                setTimeout(() => {
                    navigate("/tutor/courses");
                }, 1000);
            } else {
                toast.error(result.payload || "Failed to update course");
            }
        } catch (error) {
            toast.error("Failed to update course");
        }
    };

    if (loading && !selectedCourse) {
        return (
            <TutorLayout title="Edit Course" subtitle="Loading course details...">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            </TutorLayout>
        );
    }

    return (
        <TutorLayout title="Edit Course" subtitle="Update your course information">
            <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Course Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Course Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors bg-green-50"
                                    placeholder="Enter course title"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors bg-green-50"
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price and Offer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                                        placeholder="Enter course price"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Offer Percentage (%)
                                    </label>
                                    <input
                                        type="number"
                                        name="offer_percentage"
                                        value={formData.offer_percentage}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors bg-green-50"
                                        placeholder="Enter offer percentage"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>

                            {/* Course Thumbnail */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Course Thumbnail *
                                </label>
                                <div className="space-y-4">
                                    {imagePreview ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={imagePreview}
                                                alt="Course thumbnail"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 mb-2">Click to upload course thumbnail</p>
                                            <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                                        </div>
                                    )}
                                    
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                                        disabled={uploading}
                                    />
                                    
                                    {uploading && (
                                        <div className="flex items-center justify-center py-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2"></div>
                                            <span className="text-teal-600">Uploading...</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="8"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors resize-none bg-green-50"
                                    placeholder="Enter course description"
                                    required
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate("/tutor/courses")}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || uploading}
                                    className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Updating..." : "🔄 UPDATE COURSE"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </TutorLayout>
    );
};

export default EditCourse;