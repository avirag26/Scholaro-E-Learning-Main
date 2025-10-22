import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, Plus, Eye, X, Edit, BookOpen } from "lucide-react";
import TutorLayout from "./COMMON/TutorLayout";
import Swal from "sweetalert2";
import {
    fetchTutorCourses,
    toggleCourseListing,
    fetchCategories,
    clearError
} from "../../Redux/tutorCourseSlice";

const TutorCourses = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { courses, categories, pagination, stats, loading, error } = useSelector(
        (state) => state.tutorCourses
    );

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [modalType, setModalType] = useState(""); // 'view'
    const [selected, setSelected] = useState(null);

    // Fetch courses and categories on component mount
    useEffect(() => {
        dispatch(fetchTutorCourses({ page: currentPage, search, status: statusFilter }));
        dispatch(fetchCategories());
    }, [dispatch, currentPage, search, statusFilter]);

    // Handle Redux errors
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    // Handle search with debounce
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            setCurrentPage(1);
            dispatch(fetchTutorCourses({ page: 1, search, status: statusFilter }));
        }, 500);

        return () => clearTimeout(delayedSearch);
    }, [search, dispatch, statusFilter]);

    // Handle status filter change
    const handleStatusChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(1);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Toggle course listing
    const handleToggleListing = async (course) => {
        const action = course.listed ? "unlist" : "list";
        const actionPast = course.listed ? "unlisted" : "listed";

        const result = await Swal.fire({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Course?`,
            text: `Are you sure you want to ${action} "${course.title}"?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: course.listed ? "#ef4444" : "#10b981",
            cancelButtonColor: "#6b7280",
            confirmButtonText: `Yes, ${action} it!`,
            cancelButtonText: "Cancel"
        });

        if (!result.isConfirmed) return;

        try {
            const result = await dispatch(toggleCourseListing(course.id));
            if (toggleCourseListing.fulfilled.match(result)) {
                toast.success(`Course ${actionPast} successfully!`);
                // Refresh the courses list
                dispatch(fetchTutorCourses({ page: currentPage, search, status: statusFilter }));
            }
        } catch (error) {
            // Error is handled by Redux and useEffect
        }
    };

    // Open modal
    const openModal = (type, course = null) => {
        setModalType(type);
        setSelected(course);
    };

    // Close modal
    const closeModal = () => {
        setModalType("");
        setSelected(null);
    };

    // Format price
    const formatPrice = (price, offerPercentage = 0) => {
        if (offerPercentage > 0) {
            const discountedPrice = price - (price * offerPercentage / 100);
            return (
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">₹{discountedPrice.toFixed(0)}</span>
                    <span className="text-sm text-gray-500 line-through">₹{price}</span>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        {offerPercentage}% OFF
                    </span>
                </div>
            );
        }
        return <span className="text-lg font-bold text-gray-900">₹{price}</span>;
    };

    // Generate pagination numbers
    const generatePaginationNumbers = () => {
        if (!pagination) return [];
        const { currentPage, totalPages } = pagination;
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    if (loading && courses.length === 0) {
        return (
            <TutorLayout title="My Courses" subtitle="Manage your courses">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                </div>
            </TutorLayout>
        );
    }

    return (
        <TutorLayout title="My Courses" subtitle="Manage your courses">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            My Courses ({stats?.total || 0})
                        </h2>
                        {stats && (
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                    Listed: {stats.listed}
                                </span>
                                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                                    Unlisted: {stats.unlisted}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-64"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="all">All Courses</option>
                            <option value="listed">Listed</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        {/* Add Course Button */}
                        <button
                            onClick={() => navigate("/tutor/add-course")}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Course
                        </button>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {courses.length > 0 ? (
                    courses.map((course) => (
                        <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Course Thumbnail */}
                            <div className="relative h-48 bg-gray-200">
                                <img
                                    src={course.course_thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = '/api/placeholder/400/200';
                                    }}
                                />
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${course.listed
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {course.listed ? 'Listed' : 'Unlisted'}
                                    </span>
                                </div>
                            </div>

                            {/* Course Content */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                        {course.title}
                                    </h3>
                                </div>

                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                    {course.description}
                                </p>

                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            {course.level}
                                        </span>
                                        <span>{course.duration} hrs</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-500">★</span>
                                        <span className="text-sm text-gray-600">
                                            {course.average_rating || 0} ({course.total_reviews || 0})
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    {formatPrice(course.price, course.offer_percentage)}
                                    <span className="text-sm text-gray-500">
                                        {course.enrolled_count} enrolled
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal("view", course)}
                                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                    >
                                        <Eye className="w-4 h-4 inline mr-1" />
                                        View
                                    </button>

                                    <button
                                        onClick={() => openModal("edit", course)}
                                        className="flex-1 px-3 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors text-sm font-medium"
                                    >
                                        <Edit className="w-4 h-4 inline mr-1" />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handleToggleListing(course)}
                                        disabled={loading}
                                        className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${course.listed
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                    >
                                        {loading ? "..." : (course.listed ? "Unlist" : "List")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                            <p className="text-sm">
                                {search
                                    ? "Try adjusting your search criteria"
                                    : "Get started by creating your first course"
                                }
                            </p>
                        </div>
                        {!search && (
                            <button
                                onClick={() => navigate("/tutor/add-course")}
                                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                Create First Course
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((pagination.currentPage - 1) * 6) + 1} to {Math.min(pagination.currentPage * 6, pagination.totalItems)} of {pagination.totalItems} courses
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrev}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            {generatePaginationNumbers().map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-2 text-sm rounded-lg ${page === pagination.currentPage
                                        ? 'bg-teal-600 text-white'
                                        : 'border border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {modalType === "view" && selected && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">Course Details</h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Course Image */}
                            <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                                <img
                                    src={selected.course_thumbnail}
                                    alt={selected.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = '/api/placeholder/400/200';
                                    }}
                                />
                            </div>

                            {/* Course Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-gray-900 font-medium">{selected.title}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-gray-700">{selected.category?.title || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        {formatPrice(selected.price, selected.offer_percentage)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-gray-700">{selected.level}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-gray-700">{selected.duration} hours</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex gap-2">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selected.listed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {selected.listed ? 'Listed' : 'Unlisted'}
                                            </span>
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selected.isActive
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {selected.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <div className="p-3 bg-gray-50 rounded-lg border min-h-[100px]">
                                    <p className="text-gray-700">{selected.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Enrolled Students</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border text-center">
                                        <p className="text-2xl font-bold text-teal-600">{selected.enrolled_count}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Average Rating</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border text-center">
                                        <p className="text-2xl font-bold text-yellow-600">{selected.average_rating || 0}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Reviews</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border text-center">
                                        <p className="text-2xl font-bold text-blue-600">{selected.total_reviews || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        closeModal();
                                        openModal("edit", selected);
                                    }}
                                    className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                                >
                                    Edit Course
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </TutorLayout>
    );
};

export default TutorCourses;