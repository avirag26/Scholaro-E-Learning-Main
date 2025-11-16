import { useState, useEffect } from 'react';
import { ChevronDown, Download, FileText, Users, BookOpen, GraduationCap, DollarSign, Search, Filter, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Button from '../../ui/Button';
import RevenueChart from '../../components/Charts/RevenueChart';
import DoughnutChart from '../../components/Charts/DoughnutChart';
import BarChart from '../../components/Charts/BarChart';
import TutorLayout from "./COMMON/TutorLayout";
import { tutorAPI } from '../../api/axiosConfig';
import { exportToPDF, exportToExcel, formatCurrency, generateRevenueChartData } from '../../utils/exportUtils';
import { toast } from 'react-toastify'; 
export default function TutorDashboard() {
  const [dateFilter, setDateFilter] = useState('This Month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    activeCourses: 0,
    listedCourses: 0,
    draftCourses: 0,
    totalLessons: 0,
    totalRevenue: 0,
    totalOrders: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchCoursesData();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      let queryParams = `dateFilter=${dateFilter}`;
      if (dateFilter === 'Custom Range' && customDateRange.startDate && customDateRange.endDate) {
        queryParams += `&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
      }
      
      // Fetch dashboard stats
      const statsResponse = await tutorAPI.get(`/api/tutors/dashboard-stats?${queryParams}`);
      const data = statsResponse.data;
      
      setStats({
        totalStudents: data.totalStudents,
        totalCourses: data.totalCourses,
        activeCourses: data.activeCourses,
        listedCourses: data.listedCourses || data.activeCourses,
        draftCourses: data.draftCourses || (data.totalCourses - data.activeCourses),
        totalLessons: data.totalLessons,
        totalRevenue: data.totalRevenue,
        totalOrders: data.totalOrders
      });

      // Process monthly revenue data for chart
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartData = months.map((month, index) => {
        const monthData = data.monthlyRevenue?.find(item => item._id === index + 1);
        return {
          name: month,
          uv: monthData?.revenue || 0,
          pv: Math.round((monthData?.revenue || 0) * 0.7) // 70% profit margin
        };
      });
      setRevenueData(chartData);

      // Set orders data (courses will be fetched separately with pagination)
      setOrdersData(data.recentOrders || []);

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesData = async () => {
    try {
      setCoursesLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '5',
        search: searchTerm,
        status: statusFilter
      });
      
      const response = await tutorAPI.get(`/api/tutors/courses-paginated?${params}`);
      const data = response.data;
      

      
      setCoursesData(data.courses || []);
      setTotalPages(data.pagination?.totalPages || 1);
      
    } catch (error) {
      toast.error('Failed to load courses data');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== 'Custom Range') {
      setCustomDateRange({ startDate: '', endDate: '' });
      setShowDatePicker(false);
    }
    // Refetch dashboard data with new filter
    setTimeout(() => {
      fetchDashboardData();
    }, 100);
  };

  const handleCustomDateRange = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      setDateFilter('Custom Range');
      setShowDatePicker(false);
      setTimeout(() => {
        fetchDashboardData();
      }, 100);
    }
  };

  const formatDateForDisplay = () => {
    if (dateFilter === 'Custom Range' && customDateRange.startDate && customDateRange.endDate) {
      const start = new Date(customDateRange.startDate).toLocaleDateString();
      const end = new Date(customDateRange.endDate).toLocaleDateString();
      return `${start} - ${end}`;
    }
    return dateFilter;
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

  const handleDownloadPDF = async () => {
    try {
      const exportData = {
        stats,
        revenueData,
        coursesData,
        ordersData
      };
      
      await exportToPDF(exportData, 'Tutor Dashboard Report');
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF download failed:', error);
      // toast.error(`Failed to download PDF: ${error.message}`);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const exportData = {
        stats,
        revenueData,
        coursesData,
        ordersData
      };
      
      await exportToExcel(exportData, 'tutor-dashboard-report');
      toast.success('Excel report downloaded successfully!');
    } catch (error) {
      console.error('Excel download failed:', error);
      toast.error(`Failed to download Excel: ${error.message}`);
    }
  };
  return (
    <TutorLayout title="Dashboard" subtitle="Welcome to your tutor dashboard">
      <div className="space-y-6">
        {/* Header with Analytics Overview and Export Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Analytics Overview</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDateFilterChange('This Month')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  dateFilter === 'This Month' 
                    ? 'bg-sky-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handleDateFilterChange('Last Month')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  dateFilter === 'Last Month' 
                    ? 'bg-sky-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => handleDateFilterChange('This Year')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  dateFilter === 'This Year' 
                    ? 'bg-sky-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                This Year
              </button>
              
              {/* Custom Date Range */}
              <div className="relative">
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                    dateFilter === 'Custom Range' 
                      ? 'bg-sky-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span className="hidden sm:inline">{formatDateForDisplay()}</span>
                  <span className="sm:hidden">Custom</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {/* Date Range Picker Dropdown */}
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-[280px]">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customDateRange.startDate}
                          onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={customDateRange.endDate}
                          onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleCustomDateRange}
                          disabled={!customDateRange.startDate || !customDateRange.endDate}
                          className="flex-1 px-3 py-2 bg-sky-500 text-white text-sm rounded hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Overlay to close dropdown */}
                {showDatePicker && (
                  <div 
                    className="fixed inset-0 z-5" 
                    onClick={() => setShowDatePicker(false)}
                  />
                )}
              </div>
            </div>
          </div>
          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button 
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2"
              disabled={loading}
            >
              <FileText className="w-4 h-4" />
              <span>{loading ? 'Loading...' : 'PDF'}</span>
            </Button>
            <Button 
              onClick={handleDownloadExcel}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Loading...' : 'Excel'}</span>
            </Button>


          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-sky-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Courses</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.totalCourses}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Courses</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.activeCourses}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-500" />
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

        {/* Revenue Chart */}
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
          {/* Course Performance Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Course Performance</h3>
            <DoughnutChart 
              data={[
                { label: 'Active Courses', value: stats.activeCourses },
                { label: 'Draft Courses', value: stats.draftCourses },
                { label: 'Total Lessons', value: stats.totalLessons }
              ]}
            />
          </div>

          {/* Key Metrics Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
            <BarChart 
              data={[
                { label: 'Total Orders', value: stats.totalOrders },
                { label: 'Students', value: stats.totalStudents },
                { label: 'Lessons', value: stats.totalLessons }
              ]}
            />
          </div>
        </div>

        {/* Course Management Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Course Management</h3>
              <div className="flex items-center space-x-2">
                
              </div>
            </div>
            
            {/* Filters */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {/* Search */}
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="px-3 py-1 pr-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            )}
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
                    Lessons
                  </th>
                
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coursesLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      Loading courses...
                    </td>
                  </tr>
                ) : coursesData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      {searchTerm || statusFilter !== 'all' ? 'No courses match your filters' : 'No courses found'}
                    </td>
                  </tr>
                ) : (
                  coursesData.map((course) => (
                    <tr key={course._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {course.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.enrolled_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.enrolled_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.lessons_count || 0}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{course.price || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.listed && course.isActive
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {course.listed && course.isActive ? 'Published' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          

          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center px-3 py-1 rounded text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded text-sm ${
                            currentPage === pageNum
                              ? 'bg-sky-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-3 py-1 rounded text-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TutorLayout>
  );
}
