import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, Plus, Edit, BookOpen, Award, Settings } from "lucide-react";
import TutorLayout from "./COMMON/TutorLayout";
import Swal from "sweetalert2";
import PriceDisplay from "../../components/PriceDisplay";
import {
    fetchTutorCourses,
    toggleCourseListing,
    fetchCategories,
    clearError
} from "../../Redux/courseSlice";
const TutorCourses = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { tutorCourses: courses, categories, pagination, stats, loading, error } = useSelector(
        (state) => state.courses
    );
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        dispatch(fetchTutorCourses({ page: currentPage, search, status: statusFilter }));
        dispatch(fetchCategories());
    }, [dispatch, currentPage, search, statusFilter]);
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error, dispatch]);
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            setCurrentPage(1);
            dispatch(fetchTutorCourses({ page: 1, search, status: statusFilter }));
        }, 500);
        return () => clearTimeout(delayedSearch);
    }, [search, dispatch, statusFilter]);
    const handleStatusChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(1);
    };
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };
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
                dispatch(fetchTutorCourses({ page: currentPage, search, status: statusFilter }));
            } else if (toggleCourseListing.rejected.match(result)) {
                // Check if the error is due to admin unlisting
                if (result.payload && result.payload.unlistedByAdmin) {
                    toast.error("This course has been unlisted by admin and cannot be listed by tutor");
                } else {
                    const errorMessage = result.payload?.message || result.payload || `Failed to ${action} course`;
                    toast.error(errorMessage);
                }
            }
        } catch (error) {
            toast.error(`Failed to ${action} course`);
        }
    };
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
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="all">All Courses</option>
                            <option value="listed">Listed</option>
                            <option value="unlisted">Unlisted</option>
                            
                        </select>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {courses.length > 0 ? (
                    courses.map((course) => (
                        <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative h-48 bg-gray-200">
                                <img
                                    src={course.course_thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = '/api/placeholder/400/200';
                                    }}
                                />
                                <div className="absolute top-3 right-3 flex flex-col gap-1">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${course.listed
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {course.listed ? 'Listed' : 'Unlisted'}
                                    </span>
                                    {course.unlistedByAdmin && !course.listed && (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                            Admin Unlisted
                                        </span>
                                    )}
                                </div>
                            </div>
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
{/*                                     
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-500">?</span>
                                        <span className="text-sm text-gray-600">
                                            {course.average_rating || 0} ({course.total_reviews || 0})
                                        </span>
                                    </div> */}
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <PriceDisplay price={course.price} offerPercentage={course.offer_percentage} />
                                    <span className="text-sm text-gray-500">
                                        {course.enrolled_count} enrolled
                                    </span>
                                </div>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => navigate(`/tutor/edit-course/${course.id}`)}
                                        className="flex-1 px-3 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors text-sm font-medium"
                                    >
                                        <Edit className="w-4 h-4 inline mr-1" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleToggleListing(course)}
                                        disabled={loading || (course.unlistedByAdmin && !course.listed)}
                                        className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${
                                            course.unlistedByAdmin && !course.listed
                                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                : course.listed
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                        title={course.unlistedByAdmin && !course.listed ? 'This course was unlisted by admin' : ''}
                                    >
                                        {loading ? "..." : 
                                         course.unlistedByAdmin && !course.listed ? "Admin Unlisted" :
                                         (course.listed ? "Unlist" : "List")}
                                    </button>
                                </div>
                                <button
                                    onClick={() => navigate(`/tutor/add-lesson/${course.id}`)}
                                    className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-bold border-2 border-teal-600 mb-2"
                                >
                                    <Plus className="w-4 h-4 inline mr-2" />
                                    MANAGE LESSONS
                                </button>
                                
                                {/* Exam Management Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/tutor/course/${course.id}/exam`)}
                                        className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                                    >
                                        <Award className="w-4 h-4 inline mr-1" />
                                        Exam
                                    </button>
                                    <button
                                        onClick={() => navigate(`/tutor/course/${course.id}/final-lesson`)}
                                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                    >
                                        <Settings className="w-4 h-4 inline mr-1" />
                                        Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
        </TutorLayout>
    );
};
export default TutorCourses;
