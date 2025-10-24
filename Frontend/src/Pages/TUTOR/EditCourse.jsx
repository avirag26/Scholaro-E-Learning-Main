import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import TutorLayout from "./COMMON/TutorLayout";
import ImageUpload from "../../components/ImageUpload";

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
    const [isSubmitting, setIsSubmitting] = useState(false);



    useEffect(() => {
        if (courseId) {
            dispatch(fetchCourseDetails(courseId));
        }
        dispatch(fetchCategories());
    }, [dispatch, courseId]);

    useEffect(() => {
        if (selectedCourse) {
            console.log("Selected course data:", selectedCourse);
            setFormData({
                title: selectedCourse.title || "",
                category: selectedCourse.category?._id || selectedCourse.category || "",
                description: selectedCourse.description || "",
                price: selectedCourse.price?.toString() || "",
                offer_percentage: selectedCourse.offer_percentage?.toString() || "",
                course_thumbnail: selectedCourse.course_thumbnail || ""
            });
        }
    }, [selectedCourse]);

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

    const handleImageUpload = (imageUrl) => {
        setFormData(prev => ({
            ...prev,
            course_thumbnail: imageUrl
        }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
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

        setIsSubmitting(true);

        try {
            const courseData = {
                title: formData.title.trim(),
                category: formData.category,
                description: formData.description.trim(),
                price: parseFloat(formData.price),
                offer_percentage: parseFloat(formData.offer_percentage) || 0,
                course_thumbnail: formData.course_thumbnail
            };

            console.log("Updating course with data:", courseData);
            console.log("Course ID:", courseId);

            const result = await dispatch(updateCourse({ id: courseId, courseData }));

            console.log("Update result:", result);

            if (updateCourse.fulfilled.match(result)) {
                toast.success("Course updated successfully!");
                setTimeout(() => {
                    navigate("/tutor/courses");
                }, 1000);
            } else {
                console.error("Update failed:", result);
                toast.error(result.payload || "Failed to update course");
            }
        } catch (error) {
            console.error("Course update error:", error);
            toast.error("Failed to update course");
        } finally {
            setIsSubmitting(false);
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Course Thumbnail *
                                </label>
                                <ImageUpload
                                    onImageUpload={handleImageUpload}
                                    currentImage={formData.course_thumbnail}
                                    title="Course Thumbnail"
                                    uploadFolder="course-thumbnails"
                                />
                            </div>


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
                                    disabled={loading || isSubmitting}
                                    className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Updating..." : "🔄 UPDATE COURSE"}
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