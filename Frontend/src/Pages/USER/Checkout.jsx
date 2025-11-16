import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Tag, X } from 'lucide-react';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import { getCart, clearCart, clearRemovedItems } from '../../Redux/cartSlice';
import { createOrder, verifyPayment, createDirectOrder, verifyDirectPayment } from '../../Redux/paymentSlice';
import { userAPI } from '../../api/axiosConfig';
import AvailableCoupons from '../../components/Coupons/AvailableCoupons';
import { handleRazorpayError, buildFailureUrl, PAYMENT_ERROR_CODES } from '../../utils/paymentErrorHandler';

function Checkout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { items, loading: cartLoading, removedItems } = useSelector(state => state.cart);
    const { loading: paymentLoading } = useSelector(state => state.payment);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Handle direct enrollment
    const directEnrollment = location.state?.directEnrollment;
    const directCourse = location.state?.course;
    
    // Coupon state - now supports multiple coupons (one per tutor)
    const [couponCode, setCouponCode] = useState('');
    const [showCouponsModal, setShowCouponsModal] = useState(false);
    const [appliedCoupons, setAppliedCoupons] = useState({}); // { tutorId: couponData }
    const [couponLoading, setCouponLoading] = useState(false);
    const [selectedTutorForCoupon, setSelectedTutorForCoupon] = useState(null);


    useEffect(() => {
        // Only fetch cart if not doing direct enrollment
        if (!directEnrollment) {
            dispatch(getCart());
        }
    }, [dispatch, directEnrollment]);

    // Show message for removed unavailable courses (only once)
    useEffect(() => {
        if (removedItems && removedItems.length > 0) {
            // Check if we already showed this message recently
            const lastShownTime = localStorage.getItem('lastRemovedItemsMessage');
            const now = Date.now();
            
            if (!lastShownTime || (now - parseInt(lastShownTime)) > 15000) { // 15 seconds cooldown
                const removedCourseNames = removedItems.map(item => 
                    `${item.title} (${item.reason.toLowerCase()})`
                ).join(', ');

                toast.warning(
                    `${removedItems.length} course${removedItems.length > 1 ? 's were' : ' was'} automatically removed from your cart: ${removedCourseNames}`,
                    { 
                        autoClose: 8000,
                        toastId: 'cart-removed-items'
                    }
                );
                
                // Store the time we showed the message
                localStorage.setItem('lastRemovedItemsMessage', now.toString());
            }

            // Clear the removed items after showing the message
            dispatch(clearRemovedItems());
        }
    }, [removedItems, dispatch]);

    const calculateDiscountedPrice = (price, offerPercentage) => {
        if (!offerPercentage) return price;
        return price - (price * offerPercentage / 100);
    };

    const calculateTotalSavings = () => {
        if (directEnrollment && directCourse) {
            const originalPrice = directCourse.price;
            const discountedPrice = calculateDiscountedPrice(originalPrice, directCourse.offer_percentage);
            return originalPrice - discountedPrice;
        }
        return items.reduce((total, item) => {
            const originalPrice = item.course.price;
            const discountedPrice = calculateDiscountedPrice(originalPrice, item.course.offer_percentage);
            return total + (originalPrice - discountedPrice);
        }, 0);
    };

    const getAvailableItems = () => {
        if (directEnrollment && directCourse) {
            // For direct enrollment, create a cart-like item structure
            return [{
                _id: 'direct-' + (directCourse.id || directCourse._id),
                course: directCourse
            }];
        }
        return items.filter(item => {
            const course = item.course;
            return course.listed && course.isActive && !course.isBanned;
        });
    };

    const calculateAvailableTotal = () => {
        if (directEnrollment && directCourse) {
            return calculateDiscountedPrice(directCourse.price, directCourse.offer_percentage);
        }
        return getAvailableItems().reduce((total, item) => {
            const discountedPrice = calculateDiscountedPrice(item.course.price, item.course.offer_percentage);
            return total + discountedPrice;
        }, 0);
    };

    // Group items by tutor
    const getItemsByTutor = () => {
        const availableItems = getAvailableItems();
        const groupedItems = {};
        
        availableItems.forEach(item => {
            const tutorId = item.course.tutor._id || item.course.tutor;
            const tutorName = item.course.tutor.full_name || 'Unknown Tutor';
            
            if (!groupedItems[tutorId]) {
                groupedItems[tutorId] = {
                    tutorId,
                    tutorName,
                    items: [],
                    subtotal: 0
                };
            }
            
            const discountedPrice = calculateDiscountedPrice(item.course.price, item.course.offer_percentage);
            groupedItems[tutorId].items.push(item);
            groupedItems[tutorId].subtotal += discountedPrice;
        });
        
        return groupedItems;
    };

    // Coupon functions
    const applyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        const itemsByTutor = getItemsByTutor();
        const tutorIds = Object.keys(itemsByTutor);
        
        // Auto-select tutor if only one
        let targetTutorId = selectedTutorForCoupon;
        if (tutorIds.length === 1) {
            targetTutorId = tutorIds[0];
        }

        if (!targetTutorId) {
            toast.error('Please select a tutor to apply the coupon to');
            return;
        }

        // Check if coupon already applied to this tutor
        if (appliedCoupons[targetTutorId]) {
            toast.error('Coupon already applied to this tutor\'s courses');
            return;
        }

        setCouponLoading(true);
        try {
            const tutorItems = itemsByTutor[targetTutorId];
            
            if (!tutorItems) {
                toast.error('No courses found for selected tutor');
                return;
            }

            const courseIds = tutorItems.items.map(item => item.course._id);
            const totalAmount = tutorItems.subtotal;

            const response = await userAPI.post('/api/users/validate-coupon', {
                code: couponCode.trim(),
                courseIds,
                totalAmount,
                tutorId: targetTutorId
            });

            // Add tutor info to the response
            const couponData = {
                ...response.data,
                tutorId: targetTutorId,
                tutorName: tutorItems.tutorName
            };

            setAppliedCoupons(prev => ({
                ...prev,
                [targetTutorId]: couponData
            }));

            setCouponCode('');
            setSelectedTutorForCoupon(null);
            toast.success(`Coupon applied to ${tutorItems.tutorName}'s courses!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid coupon code');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleCouponSelect = (code) => {
        setCouponCode(code);
        setShowCouponsModal(false);
    };

    const removeCoupon = (tutorId) => {
        setAppliedCoupons(prev => {
            const newCoupons = { ...prev };
            delete newCoupons[tutorId];
            return newCoupons;
        });
        toast.info('Coupon removed');
    };

    const getTotalCouponDiscount = () => {
        return Object.values(appliedCoupons).reduce((total, coupon) => {
            return total + (coupon.discount?.amount || 0);
        }, 0);
    };

    const calculateFinalTotal = () => {
        const subtotal = calculateAvailableTotal();
        const couponDiscount = getTotalCouponDiscount();
        const subtotalAfterCoupons = Math.max(0, subtotal - couponDiscount);
        const tax = subtotalAfterCoupons * 0.03; // Tax calculated AFTER coupon discount
        const finalAmount = subtotalAfterCoupons + tax;
        
        // Apply same rounding as backend (convert to paise and back)
        const amountInPaise = Math.round(finalAmount * 100);
        return amountInPaise / 100;
    };

    const handleProceedToCheckout = async () => {
        // Check if we have items (either from cart or direct enrollment)
        if (!directEnrollment && items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        if (directEnrollment && !directCourse) {
            toast.error('No course selected for enrollment');
            return;
        }

        // Check for unavailable courses
        const availableItems = getAvailableItems();
        let unavailableItems = [];
        
        if (!directEnrollment) {
            unavailableItems = items.filter(item => {
                const course = item.course;
                return !course || !course.listed || !course.isActive || course.isBanned;
            });
        } else {
            // For direct enrollment, the course is already validated by the public API
            // If we have a course object, it means it's available for enrollment
            if (!directCourse || !directCourse.id && !directCourse._id) {
                toast.error('Invalid course data for enrollment');
                return;
            }
        }

        if (availableItems.length === 0) {
            toast.error('All courses in your cart are currently unavailable. Please go back to your cart and remove them.');
            return;
        }

        if (unavailableItems.length > 0) {
            // Show detailed message about unavailable courses
            const unavailableCourseNames = unavailableItems.map(item => {
                const course = item.course;
                const reason = !course ? 'Course not found' :
                              !course.isActive ? 'Course is inactive' :
                              course.isBanned ? 'Course is banned' :
                              !course.listed ? 'Course is unlisted' : 'Course unavailable';
                return `${course?.title || 'Unknown Course'} (${reason})`;
            }).join(', ');

            toast.warning(
                `${unavailableItems.length} course${unavailableItems.length > 1 ? 's' : ''} removed from checkout: ${unavailableCourseNames}`,
                { autoClose: 6000 }
            );
        }

        // Check if Razorpay is loaded
        if (!window.Razorpay) {
            toast.error('Payment gateway not loaded. Please refresh the page.');
            return;
        }

        try {
            // Prepare coupon data for order creation
            const couponData = Object.keys(appliedCoupons).length > 0 ? {
                appliedCoupons: Object.fromEntries(
                    Object.entries(appliedCoupons).map(([tutorId, couponInfo]) => [
                        tutorId,
                        {
                            couponId: couponInfo.coupon._id,
                            code: couponInfo.coupon.code,
                            discountAmount: couponInfo.discount.amount,
                            tutorName: couponInfo.tutorName
                        }
                    ])
                )
            } : {};

            // Create temporary Razorpay order (no database order created yet)
            let orderData;
            if (directEnrollment) {
                // Use direct enrollment API
                const appliedCoupon = Object.keys(appliedCoupons).length > 0 ? 
                    Object.values(appliedCoupons)[0] : null; // Take first coupon for direct enrollment
                orderData = await dispatch(createDirectOrder({
                    courseId: directCourse.id || directCourse._id,
                    appliedCoupon
                })).unwrap();
            } else {
                // Use regular cart-based order
                orderData = await dispatch(createOrder(couponData)).unwrap();
            }

            const options = {
                key: orderData.key,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: 'Scholaro',
                description: 'Course Purchase',
                order_id: orderData.order.id,
                handler: async function (response) {
                    try {
                        // Verify payment and create actual order in database
                        if (directEnrollment) {
                            await dispatch(verifyDirectPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })).unwrap();
                        } else {
                            await dispatch(verifyPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })).unwrap();

                            // Clear cart state after successful payment (only for cart-based checkout)
                            await dispatch(clearCart()).unwrap();
                            
                            // Small delay to ensure backend operation completes
                            setTimeout(() => {
                                dispatch(getCart());
                            }, 500);
                        }
                        
                        // Refresh user data to get updated course enrollments
                        const { fetchUserProfile } = await import('../../Redux/currentUserSlice');
                        dispatch(fetchUserProfile());
                        
                        toast.success('Payment successful! You are now enrolled in the course' + (directEnrollment ? '!' : 's!'));
                        navigate(`/user/order-success/${orderData.order.orderId}`);
                    } catch (error) {
                        // Payment verification failed - redirect to failure page
                        const errorMessage = error.message || 'Payment verification failed';
                        const failureUrl = buildFailureUrl(
                            PAYMENT_ERROR_CODES.VERIFICATION_FAILED,
                            errorMessage,
                            orderData.order.orderId,
                            response.razorpay_payment_id
                        );
                        navigate(failureUrl);
                    }
                },
                modal: {
                    ondismiss: function() {
                        // User cancelled payment - redirect to failure page
                        const failureUrl = buildFailureUrl(
                            PAYMENT_ERROR_CODES.USER_CANCELLED,
                            'Payment was cancelled by user'
                        );
                        navigate(failureUrl);
                    },
                    onhidden: function() {
                        // Modal was closed without payment completion
                    }
                },
                prefill: {
                    name: 'Student Name',
                    email: 'student@example.com',
                    contact: '9999999999'
                },
                theme: {
                    color: '#0ea5e9' // sky-500 color
                }
            };

            const rzp = new window.Razorpay(options);
            
            // Handle Razorpay errors
            rzp.on('payment.failed', function (response) {
                handleRazorpayError(response.error, navigate, orderData.order.orderId);
            });
            
            rzp.open();
        } catch (error) {
            // Order creation failed - redirect to failure page
            const errorMessage = error.message || error || 'Failed to initiate payment';
            const failureUrl = buildFailureUrl(
                PAYMENT_ERROR_CODES.ORDER_CREATION_FAILED,
                errorMessage
            );
            navigate(failureUrl);
        }
    };

    if (cartLoading) {
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {directEnrollment ? 'Course Enrollment' : 'Checkout Page'}
                    </h1>
                    <nav className="flex space-x-4">
                        <Link to="/user/courses" className="text-gray-600 hover:text-sky-500">Courses</Link>
                        {!directEnrollment && (
                            <Link to="/user/cart" className="text-gray-600 hover:text-sky-500">Shopping Cart</Link>
                        )}
                        {directEnrollment && directCourse && (
                            <Link to={`/user/course/${directCourse.id || directCourse._id}`} className="text-gray-600 hover:text-sky-500">
                                {directCourse.title}
                            </Link>
                        )}
                        <span className="text-sky-500 font-medium">
                            {directEnrollment ? 'Enrollment' : 'Checkout'}
                        </span>
                    </nav>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Payment Method Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
                            
                            {/* Razorpay Payment Info */}
                            <div className="mb-6">
                                <div className="p-6 border-2 border-sky-200 rounded-lg bg-sky-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-sky-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-semibold text-gray-900">Secure Payment with Razorpay</h3>
                                                <p className="text-sm text-gray-600">Pay safely using multiple payment methods</p>
                                            </div>
                                        </div>
                                        <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-8" />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="flex items-center justify-center p-3 bg-white rounded-lg border">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-6" />
                                        </div>
                                        <div className="flex items-center justify-center p-3 bg-white rounded-lg border">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                                        </div>
                                        <div className="flex items-center justify-center p-3 bg-white rounded-lg border">
                                            <span className="text-sm font-semibold text-gray-700">UPI</span>
                                        </div>
                                        <div className="flex items-center justify-center p-3 bg-white rounded-lg border">
                                            <span className="text-sm font-semibold text-gray-700">Net Banking</span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-sm text-gray-600">
                                        <p className="mb-2">✓ Secure 256-bit SSL encryption</p>
                                        <p className="mb-2">✓ Multiple payment options (Cards, UPI, Wallets, Net Banking)</p>
                                        <p>✓ Instant course access after successful payment</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Details Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Details</h2>

                            {/* Course Items - Only show available courses */}
                            <div className="space-y-4 mb-6">
                                {getAvailableItems().map((item) => {
                                    const course = item.course;
                                    const discountedPrice = calculateDiscountedPrice(course.price, course.offer_percentage);

                                    return (
                                        <div key={item._id} className="flex gap-3">
                                            <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                                <img
                                                    src={course.course_thumbnail}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                                                <p className="text-xs text-gray-500">{course.lessons?.length || 0} Lectures</p>
                                                <p className="text-sm font-bold text-gray-900">₹{discountedPrice.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {/* Show unavailable courses notification */}
                                {items.length > getAvailableItems().length && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-800">
                                            {items.length - getAvailableItems().length} unavailable course{items.length - getAvailableItems().length > 1 ? 's' : ''} excluded from checkout
                                        </p>
                                    </div>
                                )}
                            </div>

                           
                            {/* Price Breakdown */}
                            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Price ({getAvailableItems().length} available items)</span>
                                    <span className="font-medium">₹{(calculateAvailableTotal() + calculateTotalSavings()).toFixed(2)}</span>
                                </div>

                                {calculateTotalSavings() > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{calculateTotalSavings().toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax (3%)</span>
                                    <span className="font-medium">₹{((Math.max(0, calculateAvailableTotal() - getTotalCouponDiscount())) * 0.03).toFixed(2)}</span>
                                </div>

                                {/* Coupon Discounts */}
                                {Object.values(appliedCoupons).map((coupon) => (
                                    <div key={coupon.tutorId} className="flex justify-between text-green-600">
                                        <span>Coupon ({coupon.coupon.code}) - {coupon.tutorName}</span>
                                        <span>-₹{coupon.discount.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Section */}
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Have a coupon code?</h3>
                                
                                {/* Applied Coupons */}
                                {Object.values(appliedCoupons).length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {Object.values(appliedCoupons).map((coupon) => (
                                            <div key={coupon.tutorId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center space-x-2">
                                                    <Tag className="w-4 h-4 text-green-600" />
                                                    <div>
                                                        <span className="text-sm font-medium text-green-800">
                                                            {coupon.coupon.code} - {coupon.coupon.title}
                                                        </span>
                                                        <div className="text-xs text-green-600">
                                                            Applied to {coupon.tutorName}'s courses
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeCoupon(coupon.tutorId)}
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add New Coupon */}
                                <div className="space-y-3">
                                    {/* Tutor Selection */}
                                    {Object.keys(getItemsByTutor()).length > 1 && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Select tutor to apply coupon:
                                            </label>
                                            <select
                                                value={selectedTutorForCoupon || ''}
                                                onChange={(e) => setSelectedTutorForCoupon(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                                            >
                                                <option value="">Choose a tutor...</option>
                                                {Object.values(getItemsByTutor()).map((tutorGroup) => {
                                                    const hasAppliedCoupon = appliedCoupons[tutorGroup.tutorId];
                                                    return (
                                                        <option 
                                                            key={tutorGroup.tutorId} 
                                                            value={tutorGroup.tutorId}
                                                            disabled={hasAppliedCoupon}
                                                        >
                                                            {tutorGroup.tutorName} ({tutorGroup.items.length} courses)
                                                            {hasAppliedCoupon ? ' - Coupon Applied' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    )}

                                    {/* Coupon Input */}
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Enter coupon code"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                                            onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                                        />
                                        <button
                                            onClick={applyCoupon}
                                            disabled={
                                                couponLoading || 
                                                !couponCode.trim() || 
                                                (Object.keys(getItemsByTutor()).length > 1 && !selectedTutorForCoupon)
                                            }
                                            className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                        >
                                            {couponLoading ? 'Applying...' : 'Apply'}
                                        </button>
                                    </div>

                                    {/* Browse Coupons Button */}
                                    <div className="mt-3">
                                        <button
                                            onClick={() => setShowCouponsModal(true)}
                                            className="text-sky-600 hover:text-sky-700 text-sm font-medium flex items-center space-x-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span>Browse Available Coupons</span>
                                        </button>
                                    </div>

                                    {/* Auto-select tutor if only one */}
                                    {Object.keys(getItemsByTutor()).length === 1 && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            Coupon will be applied to {Object.values(getItemsByTutor())[0].tutorName}'s courses
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between text-xl font-bold mb-6">
                                <span>Total</span>
                                <span>₹{calculateFinalTotal().toFixed(2)}</span>
                            </div>

                            {/* Proceed Button */}
                            <button
                                onClick={handleProceedToCheckout}
                                disabled={paymentLoading || (!directEnrollment && items.length === 0) || (directEnrollment && !directCourse)}
                                className="w-full bg-sky-500 text-white py-3 rounded-lg font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {paymentLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Pay Securely with Razorpay
                                    </>
                                )}
                            </button>
                            
                            {/* Payment Info */}
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600 text-center">
                                    After successful payment, you'll get instant access to all courses and they will be added to your learning dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Available Coupons Modal */}
            <AvailableCoupons
                isOpen={showCouponsModal}
                onClose={() => setShowCouponsModal(false)}
                onCouponSelect={handleCouponSelect}
                selectedTutorId={selectedTutorForCoupon}
            />

            <Footer />
        </div>
    );
}

export default Checkout;