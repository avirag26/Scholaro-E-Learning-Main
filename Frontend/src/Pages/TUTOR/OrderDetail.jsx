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
import TutorLayout from './COMMON/TutorLayout';
import Loading from '../../ui/Loading';
import { tutorOrderService } from '../../services/tutorOrderService';

const TutorOrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await tutorOrderService.getOrderDetails(orderId);
      if (response.success) {
        setOrder(response.order);
      } else {
        toast.error('Order not found');
        navigate('/tutor/orders');
      }
    } catch (error) {
      toast.error('Failed to fetch order details');
      navigate('/tutor/orders');
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
      <TutorLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/tutor/orders')}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </TutorLayout>
    );
  }

  return (
    <TutorLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/tutor/orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Sale Details</h1>
              <p className="text-gray-600">Order ID: {order.orderId}</p>
            </div>
          </div>

          {/* Status Display */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="font-medium">
                Course Sale - {getStatusText()}
              </span>
            </div>

            <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg">
              ✅ Payment received successfully
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Student Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Information
              </h2>
              
              <div className="flex items-start gap-4">
                <img
                  src={order.student.profileImage || '/default-avatar.png'}
                  alt={order.student.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{order.student.name}</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{order.student.email}</span>
                    </div>
                    {order.student.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{order.student.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {formatDate(order.student.memberSince)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Your Courses Purchased
              </h2>
              
              <div className="space-y-6">
                {order.courses.map((courseItem, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex gap-4">
                      <img
                        src={courseItem.thumbnail || '/default-course.jpg'}
                        alt={courseItem.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{courseItem.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{courseItem.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="ml-2 font-medium">{courseItem.category.title}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Level:</span>
                            <span className="ml-2 font-medium">{courseItem.level}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-2 font-medium">{courseItem.duration}h</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-semibold text-gray-900">
                              {formatCurrency(courseItem.discountedPrice)}
                            </span>
                            {courseItem.originalPrice > courseItem.discountedPrice && (
                              <>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatCurrency(courseItem.originalPrice)}
                                </span>
                                <span className="text-sm text-green-600 font-medium">
                                  Saved {formatCurrency(courseItem.savings)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Your Earnings
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Course Revenue</span>
                  <span className="font-medium">{formatCurrency(order.payment.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Course Discount</span>
                  <span className="font-medium text-red-600">-{formatCurrency(order.payment.discount)}</span>
                </div>
                
                {/* Coupon Discount Section */}
                {order.payment.couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coupon Discount</span>
                    <span className="font-medium text-red-600">-{formatCurrency(order.payment.couponDiscount)}</span>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  {(() => {
                    // Use actualTotal if available, otherwise calculate manually
                    const actualAmount = order.payment.actualTotal || (order.payment.total - (order.payment.couponDiscount || 0));
                    const tutorEarnings = actualAmount * 0.9;
                    const platformFee = actualAmount * 0.1;
                    
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold">Your Earnings (90%)</span>
                          <span className="text-lg font-semibold text-green-600">{formatCurrency(tutorEarnings)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>Platform Fee (10%)</span>
                          <span>-{formatCurrency(platformFee)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Actual Revenue</span>
                          <span>{formatCurrency(actualAmount)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Applied Coupon Section */}
              {order.payment.appliedCoupons && order.payment.appliedCoupons[order.courses[0]?.tutor?.id] && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium text-gray-900 mb-3">Applied Coupon</h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-orange-800">
                          {order.payment.appliedCoupons[order.courses[0]?.tutor?.id]?.couponCode || 'Coupon Applied'}
                        </p>
                        <p className="text-sm text-orange-600">Student used your coupon</p>
                      </div>
                      <span className="text-orange-700 font-medium">
                        -{formatCurrency(order.payment.couponDiscount)}
                      </span>
                    </div>
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
                    <span className="text-gray-600">Status</span>
                    <span className="text-green-600 font-medium">Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Sale Timeline
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

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">Sale Completed!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    The student now has access to your course and you've earned {formatCurrency(order.payment.total)} from this sale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TutorLayout>
  );
};

export default TutorOrderDetail;