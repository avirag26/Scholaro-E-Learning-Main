import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';
import { getCart, clearCart, clearRemovedItems } from '../../Redux/cartSlice';
import { createOrder, verifyPayment } from '../../Redux/paymentSlice';

function Checkout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, loading: cartLoading, removedItems } = useSelector(state => state.cart);
    const { loading: paymentLoading } = useSelector(state => state.payment);
    const [sidebarOpen, setSidebarOpen] = useState(false);


    useEffect(() => {
        dispatch(getCart());
    }, [dispatch]);

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
        return items.reduce((total, item) => {
            const originalPrice = item.course.price;
            const discountedPrice = calculateDiscountedPrice(originalPrice, item.course.offer_percentage);
            return total + (originalPrice - discountedPrice);
        }, 0);
    };

    const getAvailableItems = () => {
        return items.filter(item => {
            const course = item.course;
            return course.listed && course.isActive && !course.isBanned;
        });
    };

    const calculateAvailableTotal = () => {
        return getAvailableItems().reduce((total, item) => {
            const discountedPrice = calculateDiscountedPrice(item.course.price, item.course.offer_percentage);
            return total + discountedPrice;
        }, 0);
    };

    const handleProceedToCheckout = async () => {
        if (items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        // Check for unavailable courses
        const availableItems = getAvailableItems();
        const unavailableItems = items.filter(item => {
            const course = item.course;
            return !course || !course.listed || !course.isActive || course.isBanned;
        });

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
            // Create temporary Razorpay order (no database order created yet)
            const orderData = await dispatch(createOrder()).unwrap();

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
                        await dispatch(verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })).unwrap();

                        // Clear cart state after successful payment
                        await dispatch(clearCart()).unwrap();
                        
                        // Small delay to ensure backend operation completes
                        setTimeout(() => {
                            dispatch(getCart());
                        }, 500);
                        
                        toast.success('Payment successful! You are now enrolled in the courses.');
                        navigate(`/user/order-success/${orderData.order.orderId}`);
                    } catch (error) {
                        toast.error('Payment verification failed. Please contact support if amount was deducted.');
                    }
                },
                modal: {
                    ondismiss: function() {
                        toast.info('Payment cancelled. No charges were made.');
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
            rzp.open();
        } catch (error) {
            const errorMessage = error.message || error || 'Failed to initiate payment';
            toast.error(`Payment Error: ${errorMessage}`);
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout Page</h1>
                    <nav className="flex space-x-4">
                        <Link to="/user/courses" className="text-gray-600 hover:text-sky-500">Details</Link>
                        <Link to="/user/cart" className="text-gray-600 hover:text-sky-500">Shopping Cart</Link>
                        <span className="text-sky-500 font-medium">Checkout</span>
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
                                    <span className="font-medium">₹{(calculateAvailableTotal() * 0.03).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between text-xl font-bold mb-6">
                                <span>Total</span>
                                <span>₹{(calculateAvailableTotal() + (calculateAvailableTotal() * 0.03)).toFixed(2)}</span>
                            </div>

                            {/* Proceed Button */}
                            <button
                                onClick={handleProceedToCheckout}
                                disabled={paymentLoading || items.length === 0}
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

            <Footer />
        </div>
    );
}

export default Checkout;