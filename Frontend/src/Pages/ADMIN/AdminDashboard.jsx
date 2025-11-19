import { useState, useEffect } from 'react';
import { Download, FileText, Users, BookOpen, GraduationCap, DollarSign, Search, Filter, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Button from '../../ui/Button';
import RevenueChart from '../../components/Charts/RevenueChart';
import DoughnutChart from '../../components/Charts/DoughnutChart';
import BarChart from '../../components/Charts/BarChart';
import AdminLayout from './common/AdminLayout';
import { adminAPI } from '../../api/axiosConfig';
import { exportToPDF, exportToExcel, formatCurrency, generateRevenueChartData } from '../../utils/exportUtils';
import { toast } from 'react-toastify';


export default function AdminDashboard() {
    const [dateFilter, setDateFilter] = useState('This Month');
    const [customDateRange, setCustomDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTutors: 0,
        verifiedUsers: 0,
        verifiedTutors: 0,
        blockedUsers: 0,
        blockedTutors: 0,
        totalCourses: 0,
        totalRevenue: 0,
        totalOrders: 0,
        activeCourses: 0
    });
    const [revenueData, setRevenueData] = useState([]);
    const [coursesData, setCoursesData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtering states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
        limit: 10
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        fetchCoursesData();
    }, [searchTerm, statusFilter, currentPage]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const statsResponse = await adminAPI.get('/api/admin/dashboard-stats');
            setStats(statsResponse.data);


            try {
                const ordersResponse = await adminAPI.get('/api/admin/orders?limit=100');
                const orders = ordersResponse.data.orders || [];

                // Generate revenue chart data
                const chartData = generateRevenueChartData(orders);
                setRevenueData(chartData);
            } catch (orderError) {
                setRevenueData([]);
            }

        } catch (error) {
            toast.error(`Failed to load dashboard data: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoursesData = async () => {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', 10);
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await adminAPI.get(`/api/admin/courses?${params}`);
            const data = response.data;

            setCoursesData(data.data || []);
            setPagination(data.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                hasNext: false,
                hasPrev: false,
                limit: 10
            });

        } catch (error) {
            toast.error(`Failed to fetch courses: ${error.response?.data?.message || error.message}`);
            setCoursesData([]);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePrevPage = () => {
        if (pagination.hasPrev) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination.hasNext) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            // Fetch additional order data for comprehensive report
            const ordersResponse = await adminAPI.get('/api/admin/orders?limit=100');
            const orderStatsResponse = await adminAPI.get('/api/admin/orders/stats');

            const exportData = {
                stats,
                revenueData,
                coursesData: coursesData,
                ordersData: ordersResponse.data.orders || [],
                orderStats: orderStatsResponse.data.stats || {}
            };

            exportToPDF(exportData, 'Admin Dashboard Report');
            toast.success('PDF report downloaded successfully!');
        } catch (error) {
            toast.error(`Failed to download PDF: ${error.message}`);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            // Fetch additional order data for comprehensive report
            const ordersResponse = await adminAPI.get('/api/admin/orders?limit=100');
            const orderStatsResponse = await adminAPI.get('/api/admin/orders/stats');

            const exportData = {
                stats,
                revenueData,
                coursesData: coursesData,
                ordersData: ordersResponse.data.orders || [],
                orderStats: orderStatsResponse.data.stats || {}
            };

            exportToExcel(exportData, 'admin-dashboard-report');
            toast.success('Excel report downloaded successfully!');
        } catch (error) {
            toast.error(`Failed to download Excel: ${error.message}`);
        }
    };
    return (
        <AdminLayout title="Dashboard" subtitle="Welcome to your admin dashboard">
            { }
            <div className="space-y-4 sm:space-y-6">
                {/* Header with Analytics Overview and Export Buttons */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Analytics Overview</h2>
                        {/* Export Buttons */}
                        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
                            <Button
                                onClick={handleDownloadPDF}
                                className="flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm"
                                title="Download comprehensive PDF report"
                                disabled={loading}
                            >
                                <FileText className="w-4 h-4" />
                                <span>{loading ? 'Loading...' : 'PDF'}</span>
                            </Button>
                            <Button
                                onClick={handleDownloadExcel}
                                className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 text-sm"
                                title="Download detailed Excel workbook"
                                disabled={loading}
                            >
                                <Download className="w-4 h-4" />
                                <span>{loading ? 'Loading...' : 'Excel'}</span>
                            </Button>
                        </div>
                    </div>
                    
                    {/* Date Filter Section */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {/* Quick Filter Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setDateFilter('This Month')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilter === 'This Month'
                                    ? 'bg-sky-500 text-white shadow-sm'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => setDateFilter('Last Month')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilter === 'Last Month'
                                    ? 'bg-sky-500 text-white shadow-sm'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                Last Month
                            </button>
                            <button
                                onClick={() => setDateFilter('This Year')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilter === 'This Year'
                                    ? 'bg-sky-500 text-white shadow-sm'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                This Year
                            </button>
                        </div>
                        
                        {/* Custom Date Range */}
                        <div className="pt-3 border-t border-gray-200 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Calendar className="w-4 h-4" />
                                <span>Custom Range:</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                                <input
                                    type="date"
                                    value={customDateRange.startDate}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                />
                                <span className="text-gray-500 text-sm text-center hidden sm:block">to</span>
                                <input
                                    type="date"
                                    value={customDateRange.endDate}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                />
                                <Button
                                    onClick={() => {
                                        if (customDateRange.startDate && customDateRange.endDate) {
                                            setDateFilter('Custom Range');
                                            setTimeout(() => {
                                                fetchDashboardData();
                                            }, 100);
                                        }
                                    }}
                                    disabled={!customDateRange.startDate || !customDateRange.endDate}
                                    className="w-full sm:w-auto px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs sm:text-sm">Active Students</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalUsers - stats.blockedUsers}</p>
                                <p className="text-xs text-gray-500">Total: {loading ? '...' : stats.totalUsers}</p>
                            </div>
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-sky-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs sm:text-sm">Total Tutors</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalTutors}</p>
                                <p className="text-xs text-gray-500">Verified: {loading ? '...' : stats.verifiedTutors}</p>
                            </div>
                            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs sm:text-sm">Total Courses</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalCourses}</p>
                                <p className="text-xs text-gray-500">Active: {loading ? '...' : stats.activeCourses}</p>
                            </div>
                            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs sm:text-sm">Total Revenue</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-800">
                                    {loading ? '...' : formatCurrency(stats.totalRevenue)}
                                </p>
                                <p className="text-xs text-gray-500">Orders: {loading ? '...' : stats.totalOrders}</p>
                            </div>
                            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
                        </div>
                    </div>
                </div>
                {/* Revenue Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <h3 className="text-base sm:text-lg font-semibold">Revenue & Profit Overview</h3>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                                <span className="text-xs sm:text-sm text-gray-600">Revenue</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-xs sm:text-sm text-gray-600">Profit</span>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <RevenueChart data={revenueData} title="Revenue & Profit Overview" />
                    </div>
                </div>

                {/* Additional Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* User Distribution Chart */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                        <h3 className="text-base sm:text-lg font-semibold mb-4">User Distribution</h3>
                        <div className="overflow-hidden">
                            <DoughnutChart
                                data={[
                                    { label: 'Active Users', value: stats.totalUsers - stats.blockedUsers },
                                    { label: 'Blocked Users', value: stats.blockedUsers },
                                    { label: 'Verified Users', value: stats.verifiedUsers },
                                    { label: 'Unverified Users', value: stats.totalUsers - stats.verifiedUsers }
                                ]}
                            />
                        </div>
                    </div>

                    {/* Course Status Chart */}
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                        <h3 className="text-base sm:text-lg font-semibold mb-4">Course Status</h3>
                        <div className="overflow-hidden">
                            <BarChart
                                data={[
                                    { label: 'Total Courses', value: stats.totalCourses },
                                    { label: 'Active Courses', value: stats.activeCourses },
                                    { label: 'Inactive Courses', value: stats.totalCourses - stats.activeCourses }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Course Management Table */}
                <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-4 sm:p-6 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <h3 className="text-base sm:text-lg font-semibold">Course Management</h3>
                        </div>
                        
                        {/* Search */}
                        <div className="flex items-center space-x-2">
                            <Search className="w-4 h-4 text-gray-500" />
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="block sm:hidden">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading courses...</div>
                        ) : coursesData.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                {searchTerm ? 'No courses match your search' : 'No courses found'}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {coursesData.map((course, index) => (
                                    <div key={course.id || index} className="p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-medium text-gray-900 text-sm">{course.title}</h4>
                                                <p className="text-xs text-gray-500">{course.category?.title}</p>
                                            </div>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${course.listed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {course.listed ? 'Published' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                            <div>
                                                <span className="font-medium">Students:</span> {course.enrolled_count || 0}
                                            </div>
                                            <div>
                                                <span className="font-medium">Lessons:</span> {course.lessons_count || 0}
                                            </div>
                                            <div>
                                                <span className="font-medium">Price:</span> ₹{course.price || 0}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Course Name
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Students
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lessons
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 sm:px-6 py-4 text-center text-gray-500">
                                            Loading courses...
                                        </td>
                                    </tr>
                                ) : coursesData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 sm:px-6 py-4 text-center text-gray-500">
                                            {searchTerm ? 'No courses match your search' : 'No courses found'}
                                        </td>
                                    </tr>
                                ) : (
                                    coursesData.map((course, index) => (
                                        <tr key={course.id || index} className="hover:bg-gray-50">
                                            <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                                                <div>
                                                    <div className="font-medium truncate max-w-xs">{course.title}</div>
                                                    <div className="text-xs text-gray-500">{course.category?.title}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {course.enrolled_count || 0}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {course.lessons_count || 0}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ₹{course.price || 0}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${course.listed
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {course.listed ? 'Published' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {!loading && coursesData.length > 0 && pagination && (
                        <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                                    {pagination.totalItems} courses
                                </div>
                                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={!pagination.hasPrev}
                                        className={`flex items-center px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${pagination.hasPrev
                                            ? 'bg-sky-500 text-white hover:bg-sky-600'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                        <span className="hidden sm:inline">Previous</span>
                                        <span className="sm:hidden">Prev</span>
                                    </button>

                                    {/* Page Numbers - Show fewer on mobile */}
                                    {pagination.totalPages > 1 && (
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, pagination.totalPages) }, (_, i) => {
                                                let pageNum;
                                                const maxPages = window.innerWidth < 640 ? 3 : 5;
                                                if (pagination.totalPages <= maxPages) {
                                                    pageNum = i + 1;
                                                } else if (pagination.currentPage <= Math.floor(maxPages/2) + 1) {
                                                    pageNum = i + 1;
                                                } else if (pagination.currentPage >= pagination.totalPages - Math.floor(maxPages/2)) {
                                                    pageNum = pagination.totalPages - maxPages + 1 + i;
                                                } else {
                                                    pageNum = pagination.currentPage - Math.floor(maxPages/2) + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${pageNum === pagination.currentPage
                                                            ? 'bg-sky-500 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleNextPage}
                                        disabled={!pagination.hasNext}
                                        className={`flex items-center px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${pagination.hasNext
                                            ? 'bg-sky-500 text-white hover:bg-sky-600'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <span className="sm:hidden">Next</span>
                                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AdminLayout>
    );
}
