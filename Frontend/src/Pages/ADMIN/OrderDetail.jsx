import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail,
  Phone, 
  Calendar, 
  CreditCard,
  BookOpen,
  Clock,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from './common/AdminLayout';
import Loading from '../../ui/Loading';
import { adminOrderService } from '../../services/adminOrderService';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await adminOrderService.getOrderDetails(orderId);
      if (response.success) {
        setOrder(response.order);
      } else {
        toast.error('Order not found');
        navigate('/admin/orders');
      }
    } catch (error) {
      toast.error('Failed to fetch order details');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };







  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusIcon = () => {
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  const getStatusColor = () => {
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = () => {
    return 'Completed';
  };

  if (loading) {
    return <Loading />;
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <button
              onClick={() => navigate('/admin/orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Order Details</h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">Order ID: {order.orderId}</p>
            </div>
          </div>

          {/* Status Display */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="font-medium text-sm sm:text-base">
                <span className="hidden sm:inline">Course Purchase - </span>{getStatusText()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Student Information */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                Student Information
              </h2>
              
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <img
                  src={order.student.profileImage || '/default-avatar.png'}
                  alt={order.student.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{order.student.name}</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-sm sm:text-base truncate">{order.student.email}</span>
                    </div>
                    {order.student.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-sm sm:text-base">{order.student.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        <span className="hidden sm:inline">Member since </span>
                        <span className="sm:hidden">Since </span>
                        {formatDate(order.student.memberSince)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                Course Details
              </h2>
              
              <div className="space-y-4 sm:space-y-6">
                {order.courses.map((courseItem, index) => (
                  <div key={index} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <img
                        src={courseItem.thumbnail || '/default-course.jpg'}
                        alt={courseItem.title}
                        className="w-full h-32 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{courseItem.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{courseItem.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="ml-2 font-medium">{courseItem.category.title}</span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-2 font-medium">{courseItem.duration}h</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">Instructor:</span>
                            <span className="ml-2 font-medium">{courseItem.tutor.name}</span>
                          </div>
                        </div>

                        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            <span className="text-base sm:text-lg font-semibold text-gray-900">
                              {formatCurrency(courseItem.discountedPrice)}
                            </span>
                            {courseItem.originalPrice > courseItem.discountedPrice && (
                              <>
                                <span className="text-xs sm:text-sm text-gray-500 line-through">
                                  {formatCurrency(courseItem.originalPrice)}
                                </span>
                                <span className="text-xs sm:text-sm text-green-600 font-medium">
                                  Saved {formatCurrency(courseItem.savings)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tutor Information */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Instructor Details</h4>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img
                          src={courseItem.tutor.profileImage || '/default-avatar.png'}
                          alt={courseItem.tutor.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{courseItem.tutor.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{courseItem.tutor.email}</p>
                          {courseItem.tutor.subjects && (
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{courseItem.tutor.subjects}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                Payment Summary
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(order.payment.subtotal)}</span>
                </div>
                
                {/* Coupon Discount Section */}
                {order.payment.couponDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span className="font-medium">-{formatCurrency(order.payment.couponDiscount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">After Discount</span>
                      <span className="font-medium">{formatCurrency(order.payment.subtotalAfterCoupons)}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (3%)</span>
                  <span className="font-medium">{formatCurrency(order.payment.tax)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total Paid</span>
                    <span className="text-lg font-semibold">{formatCurrency(order.payment.total)}</span>
                  </div>
                </div>
              </div>

              {/* Applied Coupons Section */}
              {order.payment.appliedCoupons && Object.keys(order.payment.appliedCoupons).length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium text-gray-900 mb-3">Applied Coupons</h3>
                  <div className="space-y-3">
                    {Object.entries(order.payment.appliedCoupons).map(([tutorId, couponInfo]) => (
                      <div key={tutorId} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-green-800">{couponInfo.couponCode}</p>
                            <p className="text-sm text-green-600">{couponInfo.tutorName}</p>
                          </div>
                          <span className="text-green-700 font-medium">
                            -{formatCurrency(couponInfo.discountAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method</span>
                    <span>{order.payment.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-xs">{order.payment.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Razorpay Order ID</span>
                    <span className="font-mono text-xs">{order.razorpayOrderId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Order Timeline
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Order Created</p>
                    <p className="text-sm text-gray-600">{formatDate(order.timeline.orderCreated)}</p>
                  </div>
                </div>
                
                {order.timeline.paymentCompleted && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Payment Completed</p>
                      <p className="text-sm text-gray-600">{formatDate(order.timeline.paymentCompleted)}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">{formatDate(order.timeline.lastUpdated)}</p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderDetail;