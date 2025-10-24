import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import TutorLayout from "./COMMON/TutorLayout";
import ImageUpload from "../../components/ImageUpload";

import {
    createCourse,
    fetchCategories,
    clearError
} from "../../Redux/courseSlice";

const AddCourse = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { categories, loading, error } = useSelector((state) => state.courses);

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        description: "",
        price: "",
        offer_percentage: "",
        course_thumbnail: ""
    });




    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);


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
                duration: 1,
                level: "Beginner"
            };

            const result = await dispatch(createCourse(courseData));

            if (createCourse.fulfilled.match(result)) {
                toast.success("Course created successfully!");
                setTimeout(() => {
                    navigate("/tutor/courses");
                }, 1000);
            } else {
                toast.error(result.payload || "Failed to create course");
            }
        } catch (error) {
            console.log(error)
            toast.error("Failed to create course");
        }
    };

    return (
        <TutorLayout title="Add New Course" subtitle="Create a new course for your students">
            <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Cover Image *
                                    </label>
                                    <ImageUpload
                                        onImageUpload={handleImageUpload}
                                        currentImage={formData.course_thumbnail}
                                        title="Course Thumbnail"
                                        uploadFolder="course-thumbnails"
                                    />
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



                        {/* Submit Button */}
                        <div className="mt-8 text-center">
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Creating Course..." : "CREATE COURSE"}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </TutorLayout>
    );
};

export default AddCourse;