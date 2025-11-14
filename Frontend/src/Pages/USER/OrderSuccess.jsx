import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CheckCircle, Download, BookOpen, Clock, Users, Star } from 'lucide-react';
import { userAPI } from '../../api/axiosConfig';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';


export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      navigate('/user/courses');
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await userAPI.get(`/api/users/payment/order/${orderId}`);
      if (response.data.success) {
        const orderData = response.data.order;
        setOrder({
          orderId: orderData.orderId,
          date: new Date(orderData.createdAt).toLocaleDateString(),
          amount: orderData.finalAmount,
          subtotal: orderData.subtotalAfterCoupons || orderData.totalAmount,
          couponDiscount: orderData.couponDiscount || 0,
          tax: orderData.taxAmount,
          status: orderData.status,
          courses: orderData.items.map(item => ({
            _id: item.course._id,
            title: item.course.title,
            instructor: item.course.tutor?.full_name || 'Instructor',
            thumbnail: item.course.course_thumbnail || 'https://via.placeholder.com/300x200',
            duration: item.course.lessons?.length ? `${item.course.lessons.length} lessons` : 'No lessons',
            lessons: item.course.lessons?.length || 0,
            rating: item.course.average_rating || 0,
            students: item.course.total_students || 0,
            price: item.price,
            discountedPrice: item.discountedPrice
          }))
        });
      } else {
        toast.error('Order not found');
        navigate('/user/courses');
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load order details');
      navigate('/user/courses');
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const response = await userAPI.get(`/api/users/payment/invoice/${orderId}`);
      if (response.data.success) {
        const invoice = response.data.invoice;
        
        // Create detailed invoice content
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
Start learning and advance your career.
        `;

        // Create and download file
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
      } else {
        toast.error('Failed to generate invoice');
      }
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
            <Link
              to="/user/courses"
              className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
            >
              Go to My Courses
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. You now have access to your courses.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
            <button
              onClick={downloadInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-semibold text-gray-900">{order.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">{order.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="font-semibold text-gray-900">₹{order.subtotal?.toLocaleString()}</p>
            </div>
            {order.couponDiscount > 0 && (
              <div>
                <p className="text-sm text-gray-600">Coupon Discount</p>
                <p className="font-semibold text-green-600">-₹{order.couponDiscount?.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Tax (3%)</p>
              <p className="font-semibold text-gray-900">₹{order.tax?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold text-gray-900 text-lg">₹{order.amount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                order.status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.status === 'paid' ? 'Completed' : order.status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Purchased Courses */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your New Courses</h2>
          
          <div className="space-y-4">
            {order.courses.map((course) => (
              <div key={course._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-gray-600 mb-3">By {course.instructor}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.lessons} lessons</span>
                      </div>
                      {course.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {course.students > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course.students.toLocaleString()} students</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg font-bold text-gray-900">₹{course.discountedPrice?.toLocaleString()}</span>
                      {course.price !== course.discountedPrice && (
                        <span className="text-sm text-gray-500 line-through">₹{course.price?.toLocaleString()}</span>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <Link
                        to={`/user/course/${course._id}/learn`}
                        className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
                      >
                        Start Learning
                      </Link>
                      <Link
                        to={`/user/course/${course._id}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Course Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/user/courses"
            className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium text-center"
          >
            View All My Courses
          </Link>
          <Link
            to="/user/browse"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
          >
            Browse More Courses
          </Link>
        </div>

        {/* Success Message */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-800">
              <strong>Success!</strong> You have been enrolled in your courses and can start learning immediately.
              Check your email for course access details and receipt.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}