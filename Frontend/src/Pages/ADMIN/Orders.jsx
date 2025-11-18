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
import AdminLayout from './common/AdminLayout';
import Loading from '../../ui/Loading';
import { adminOrderService } from '../../services/adminOrderService';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 700);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update filters when debounced search term changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearchTerm,
      page: 1 // Reset to first page when search changes
    }));
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [filters]);



  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Check if admin is authenticated
      const adminToken = localStorage.getItem('adminAuthToken');
      const adminInfo = localStorage.getItem('adminInfo');

      if (!adminToken) {
        toast.error('Admin not authenticated. Please login.');
        navigate('/admin/login');
        return;
      }

      const response = await adminOrderService.getAllOrders(filters);

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
        navigate('/admin/login');
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
    setSearchTerm(e.target.value);
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
    navigate(`/admin/orders/${orderId}`);
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
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Monitor and manage all course purchases</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue || 0)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 border sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Course Sales</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-9 sm:pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {orders.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderId}</div>
                        <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(order.finalAmount)}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
                          {getStatusText()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={order.user.profileImage || '/default-avatar.png'}
                        alt={order.user.name}
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                        <div className="text-xs text-gray-500">{order.user.phone}</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-3">
                      <div>{order.items.length} course{order.items.length > 1 ? 's' : ''}</div>
                      <div className="truncate">{order.items[0]?.course.title}{order.items.length > 1 && ` +${order.items.length - 1} more`}</div>
                    </div>
                    
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="w-full px-3 py-2 bg-teal-100 text-teal-700 rounded text-sm font-medium hover:bg-teal-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-sm">
                  {debouncedSearchTerm || filters.status !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Orders will appear here once students start purchasing courses.'
                  }
                </p>
              </div>
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('orderId')}
                  >
                    Order ID
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('finalAmount')}
                  >
                    Amount
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.razorpayPaymentId?.substring(0, 20)}...
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.finalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tax: {formatCurrency(order.taxAmount)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
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
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} course{order.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {order.items[0]?.course.title}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
                        {getStatusText()}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
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
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
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
                </div>
                
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="flex items-center px-2 sm:px-3 py-1 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3 h-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>

                  {/* Page Numbers - Show fewer on mobile */}
                  <div className="flex space-x-1">
                    {[...Array(Math.min(window.innerWidth < 640 ? 3 : 5, pagination.totalPages))].map((_, index) => {
                      const maxPages = window.innerWidth < 640 ? 3 : 5;
                      let pageNumber;
                      if (pagination.totalPages <= maxPages) {
                        pageNumber = index + 1;
                      } else if (pagination.currentPage <= Math.floor(maxPages/2) + 1) {
                        pageNumber = index + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - Math.floor(maxPages/2)) {
                        pageNumber = pagination.totalPages - maxPages + 1 + index;
                      } else {
                        pageNumber = pagination.currentPage - Math.floor(maxPages/2) + index;
                      }
                      
                      if (pageNumber < 1 || pageNumber > pagination.totalPages) return null;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-2 sm:px-3 py-1 border text-xs sm:text-sm font-medium rounded ${pageNumber === pagination.currentPage
                            ? 'bg-teal-50 border-teal-500 text-teal-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center px-2 sm:px-3 py-1 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="h-3 h-3 sm:h-4 sm:w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {debouncedSearchTerm || filters.status !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Orders will appear here once students start purchasing courses.'
              }
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Orders;