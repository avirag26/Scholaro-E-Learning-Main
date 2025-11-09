import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Eye, 
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import TutorLayout from './COMMON/TutorLayout';
import Loading from '../../ui/Loading';
import { tutorOrderService } from '../../services/tutorOrderService';

const TutorOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);



  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Check if tutor is authenticated
      const tutorToken = localStorage.getItem('tutorAuthToken');
      const tutorInfo = localStorage.getItem('tutorInfo');
      
      if (!tutorToken) {
        toast.error('Tutor not authenticated. Please login.');
        navigate('/tutor/login');
        return;
      }
      
      const response = await tutorOrderService.getAllOrders(filters);
      
      if (response.success) {
        setOrders(response.orders);
        setPagination(response.pagination);
        setStats(response.stats);
      } else {
        toast.error('Failed to fetch orders: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/tutor/login');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Insufficient permissions.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to fetch orders: ' + (error.message || 'Network error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({
      ...prev,
      status,
      page: 1
    }));
  };

  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleViewOrder = (orderId) => {
    navigate(`/tutor/orders/${orderId}`);
  };

  const getStatusColor = () => {
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = () => {
    return 'Completed';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <TutorLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Course Sales</h1>
            <p className="text-gray-600">Monitor sales of your courses</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Course Sales</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={filters.search}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Status Filters */}
              <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors 
                   
                        bg-teal-600 text-white
                        
                    `}>
              All Sales
                    
                    
                  </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('orderId')}
                  >
                    Order ID
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('finalAmount')}
                  >
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.razorpayPaymentId?.substring(0, 20)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.finalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tax: {formatCurrency(order.taxAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={order.user.profileImage || '/default-avatar.png'}
                          alt={order.user.name}
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {order.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.user.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} course{order.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items[0]?.course.title}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
                        {getStatusText()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="text-teal-600 hover:text-teal-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.currentPage - 1) * filters.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * filters.limit, pagination.totalItems)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                      const pageNumber = pagination.currentPage - 2 + index;
                      if (pageNumber < 1 || pageNumber > pagination.totalPages) return null;
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNumber === pagination.currentPage
                              ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sales found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Sales will appear here once students start purchasing your courses.'
              }
            </p>
          </div>
        )}
      </div>
    </TutorLayout>
  );
};

export default TutorOrders;