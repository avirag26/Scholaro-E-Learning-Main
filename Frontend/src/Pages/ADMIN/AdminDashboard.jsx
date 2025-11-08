import { useState, useEffect } from 'react';
import { ChevronDown, Download, FileText, Users, BookOpen, GraduationCap, DollarSign } from 'lucide-react';
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

            // Fetch dashboard stats
            const statsResponse = await adminAPI.get('/api/admin/dashboard-stats');
            setStats(statsResponse.data);

            // Fetch recent orders for revenue chart
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
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setCurrentPage(1); // Reset to first page when filtering
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
            const exportData = {
                stats,
                revenueData,
                coursesData: coursesData
            };
            exportToPDF(exportData, 'Admin Dashboard Report');
            toast.success('PDF report downloaded successfully!');
        } catch (error) {
            toast.error(`Failed to download PDF: ${error.message}`);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            const exportData = {
                stats,
                revenueData,
                coursesData: coursesData
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
            <div className="space-y-6">
                { }
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-semibold text-gray-800">Analytics Overview</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setDateFilter('This Month')}
                                className={`px-3 py-1 rounded text-sm ${dateFilter === 'This Month'
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => setDateFilter('Last Month')}
                                className={`px-3 py-1 rounded text-sm ${dateFilter === 'Last Month'
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                Last Month
                            </button>
                            <div className="relative">
                                <button className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200">
                                    <span>{dateFilter}</span>
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                    { }
                    <div className="flex items-center space-x-3">
                        <Button
                            onClick={handleDownloadPDF}
                            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2"
                        >
                            <FileText className="w-4 h-4" />
                            <span>PDF</span>
                        </Button>
                        <Button
                            onClick={handleDownloadExcel}
                            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Excel</span>
                        </Button>
                    </div>
                </div>
                { }
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Students</p>
                                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalUsers}</p>
                            </div>
                            <Users className="w-8 h-8 text-sky-500" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Tutors</p>
                                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalTutors}</p>
                            </div>
                            <GraduationCap className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Courses</p>
                                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalCourses}</p>
                            </div>
                            <BookOpen className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {loading ? '...' : formatCurrency(stats.totalRevenue)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>
                </div>
                { }
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Revenue & Profit Overview</h3>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Revenue</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Profit</span>
                            </div>
                        </div>
                    </div>
                    <RevenueChart data={revenueData} title="Revenue & Profit Overview" />
                </div>

                {/* Additional Analytics */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* User Distribution Chart */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
                        <DoughnutChart
                            data={[
                                { label: 'Active Users', value: stats.totalUsers - stats.blockedUsers },
                                { label: 'Blocked Users', value: stats.blockedUsers },
                                { label: 'Verified Users', value: stats.verifiedUsers },
                                { label: 'Unverified Users', value: stats.totalUsers - stats.verifiedUsers }
                            ]}
                        />
                    </div>

                    {/* Course Status Chart */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Course Status</h3>
                        <BarChart
                            data={[
                                { label: 'Total Courses', value: stats.totalCourses },
                                { label: 'Active Courses', value: stats.activeCourses },
                                { label: 'Inactive Courses', value: stats.totalCourses - stats.activeCourses }
                            ]}
                        />
                    </div>
                </div>

                { }
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Course Management</h3>
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search courses..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => handleStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="listed">Listed</option>
                                    <option value="unlisted">Unlisted</option>
                                </select>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Course Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Students
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Enrolled
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Drafts
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rating
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Notice
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            Loading courses...
                                        </td>
                                    </tr>
                                ) : coursesData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No courses found
                                        </td>
                                    </tr>
                                ) : (
                                    coursesData.map((course, index) => (
                                        <tr key={course.id || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <div>
                                                    <div className="font-medium">{course.title}</div>
                                                    <div className="text-xs text-gray-500">{course.category?.title}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {course.enrolled_count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {course.enrolled_count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                0
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ⭐ {course.average_rating?.toFixed(1) || '0.0'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ₹{course.price || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
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
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                                    {pagination.totalItems} courses
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={!pagination.hasPrev}
                                        className={`px-3 py-1 rounded text-sm ${pagination.hasPrev
                                            ? 'bg-sky-500 text-white hover:bg-sky-600'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Previous
                                    </button>

                                    {/* Page Numbers */}
                                    {pagination.totalPages > 1 && (
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (pagination.totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (pagination.currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                                    pageNum = pagination.totalPages - 4 + i;
                                                } else {
                                                    pageNum = pagination.currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-3 py-1 rounded text-sm ${pageNum === pagination.currentPage
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
                                        className={`px-3 py-1 rounded text-sm ${pagination.hasNext
                                            ? 'bg-sky-500 text-white hover:bg-sky-600'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Next
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
