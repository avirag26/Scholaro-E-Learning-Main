import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Package, 
  Download, 
  Eye, 
  Calendar, 
  CreditCard, 
  ShoppingBag,
  Search,
  CheckCircle
} from 'lucide-react';
import { userAPI } from '../../api/axiosConfig';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import UserSidebar from '../../components/UserSidebar';


export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const [sortBy, setSortBy] = useState('newest');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, sortBy]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sort: sortBy
      });



      const response = await userAPI.get(`/api/users/payment/orders?${params}`);
      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await userAPI.get(`/api/users/payment/invoice/${orderId}`);
      if (response.data.success) {
        const invoice = response.data.invoice;
        
        const invoiceContent = `
SCHOLARO - INVOICE
==================

Invoice Details:
Order ID: ${invoice.orderId}
Date: ${invoice.date}
Customer: ${invoice.customerName}
Email: ${invoice.customerEmail}

Items Purchased:
${invoice.items.map((item, index) => 
  `${index + 1}. ${item.courseName}
     Original Price: ₹${item.price}
     Discounted Price: ₹${item.discountedPrice}`
).join('\n\n')}

Payment Summary:
Subtotal: ₹${invoice.subtotal}
Tax (3%): ₹${invoice.tax}
Total Amount: ₹${invoice.total}

Payment Status: ${invoice.paymentStatus.toUpperCase()}

Thank you for choosing Scholaro!
        `;

        const blob = new Blob([invoiceContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scholaro-invoice-${invoice.orderId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('Invoice downloaded successfully!');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const getStatusIcon = (status) => {
    // Only 'paid' status exists in our system since we only save successful payments
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusColor = (status) => {
    // Only 'paid' status exists in our system since we only save successful payments
    return 'bg-green-100 text-green-800';
  };

  const filteredOrders = orders.filter(order =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => 
      item.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/user/home" className="text-gray-700 hover:text-sky-500">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">My Orders</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex gap-8">
          {/* Sidebar */}
          <UserSidebar activeSection="orders" />

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                  <p className="text-gray-600">Track and manage your course purchases</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  

                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_high">Amount: High to Low</option>
                    <option value="amount_low">Amount: Low to High</option>
                  </select>

                </div>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'No orders match your search criteria.' : 'You haven\'t made any purchases yet.'}
                </p>
                <Link
                  to="/user/courses"
                  className="inline-flex items-center px-6 py-3 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Order Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-sky-100 rounded-lg">
                            <Package className="h-6 w-6 text-sky-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Order #{order.orderId}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-4 w-4" />
                                <span>₹{order.finalAmount?.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              Completed
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadInvoice(order.orderId)}
                              className="p-2 text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Download Invoice"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <Link
                              to={`/user/order-success/${order.orderId}`}
                              className="p-2 text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={item.course.course_thumbnail || 'https://via.placeholder.com/300x200'}
                                alt={item.course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{item.course.title}</h4>
                              <p className="text-sm text-gray-600">Course Purchase</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">₹{item.discountedPrice?.toLocaleString()}</p>
                              {item.price !== item.discountedPrice && (
                                <p className="text-sm text-gray-500 line-through">₹{item.price?.toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {order.status === 'paid' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {order.items.length} course{order.items.length > 1 ? 's' : ''} purchased
                            </span>
                            <Link
                              to="/user/courses"
                              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                            >
                              View My Courses →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalOrders)} of {pagination.totalOrders} orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(pagination.totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 text-sm rounded-lg ${
                            currentPage === page
                              ? 'bg-sky-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}