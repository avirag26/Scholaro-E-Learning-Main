import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Upload, X } from "lucide-react";
import TutorLayout from "./COMMON/TutorLayout";
import {
    createCourse,
    fetchCategories,
    clearError
} from "../../Redux/tutorCourseSlice";

const AddCourse = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { categories, loading, error } = useSelector((state) => state.tutorCourses);

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        description: "",
        price: "",
        offer_percentage: "",
        course_thumbnail: ""
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // Fetch categories on component mount
    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    // Handle Redux errors
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle image upload
    const handleImageUpload = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
                setFormData(prev => ({
                    ...prev,
                    course_thumbnail: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        } else {
            toast.error("Please select a valid image file");
        }
    };

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handle drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    };

    // Handle file input change
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    };

    // Remove image
    const removeImage = () => {
        setImagePreview(null);
        setFormData(prev => ({
            ...prev,
            course_thumbnail: ""
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            toast.error("Course title is required");
            return;
        }
        if (!formData.category) {
            toast.error("Please select a category");
            return;
        }
        if (!formData.description.trim()) {
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
                duration: 1, // Default duration
                level: "Beginner" // Default level
            };

            const result = await dispatch(createCourse(courseData));
            if (createCourse.fulfilled.match(result)) {
                toast.success("Course created successfully!");
                navigate("/tutor/courses");
            }
        } catch (error) {
            // Error is handled by Redux and useEffect
        }
    };

    return (
        <TutorLayout title="Add New Course" subtitle="Create a new course for your students">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Add New Course</h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
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

                                {/* Course Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Course Category *
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

                                {/* Regular Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Regular Price *
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-blue-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                                        placeholder="Enter price in ₹"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                {/* Offer Percentage */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Offer Percentage
                                    </label>
                                    <input
                                        type="number"
                                        name="offer_percentage"
                                        value={formData.offer_percentage}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors bg-green-50"
                                        placeholder="Enter discount percentage"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                {/* Course Thumbnail Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Cover Image *
                                    </label>
                                    <div
                                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-green-50 ${dragActive
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-gray-300 hover:border-teal-400'
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="Course thumbnail preview"
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
                                            <div className="space-y-4">
                                                <Upload className="w-12 h-12 text-teal-500 mx-auto" />
                                                <div>
                                                    <p className="text-teal-600 font-medium">Upload cover image</p>
                                                    <p className="text-gray-500 text-sm mt-1">Drag your file here</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
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
                            </div>
                        </div>

                        {/* Add Course Lessons Button */}
                        <div className="mt-8 text-center">
                            <button
                                type="button"
                                className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                                onClick={() => toast.info("Lesson management functionality coming soon!")}
                            >
                                Add Course Lessons
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </TutorLayout>
    );
};

export default AddCourse;