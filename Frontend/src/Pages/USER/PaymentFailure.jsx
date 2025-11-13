import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { XCircle, RefreshCw, ShoppingCart, CreditCard, AlertTriangle, HelpCircle } from 'lucide-react';
import { userAPI } from '../../api/axiosConfig';
import Header from './Common/Header';
import Footer from '../../components/Common/Footer';

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [failureDetails, setFailureDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);

  // Get failure details from URL params
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');
  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Set failure details from URL params or default values
    setFailureDetails({
      errorCode: errorCode || 'PAYMENT_FAILED',
      errorDescription: errorDescription || 'Payment could not be processed',
      orderId: orderId || null,
      paymentId: paymentId || null,
      timestamp: new Date().toLocaleString()
    });
    setLoading(false);
  }, [errorCode, errorDescription, orderId, paymentId]);

  const getErrorMessage = (code) => {
    const errorMessages = {
      'PAYMENT_FAILED': 'Your payment could not be processed. Please try again.',
      'INSUFFICIENT_FUNDS': 'Insufficient funds in your account. Please check your balance.',
      'CARD_DECLINED': 'Your card was declined. Please try with a different payment method.',
      'NETWORK_ERROR': 'Network connection issue. Please check your internet and try again.',
      'BANK_ERROR': 'Bank server is temporarily unavailable. Please try again later.',
      'INVALID_CARD': 'Invalid card details. Please check your card information.',
      'EXPIRED_CARD': 'Your card has expired. Please use a different card.',
      'AUTHENTICATION_FAILED': 'Payment authentication failed. Please try again.',
      'TRANSACTION_TIMEOUT': 'Transaction timed out. Please try again.',
      'GATEWAY_ERROR': 'Payment gateway error. Please try again later.',
      'USER_CANCELLED': 'Payment was cancelled by user.',
      'INVALID_AMOUNT': 'Invalid payment amount. Please contact support.',
      'DUPLICATE_ORDER': 'Duplicate order detected. Please check your orders.',
      'MERCHANT_ERROR': 'Merchant configuration error. Please contact support.'
    };
    
    return errorMessages[code] || 'An unexpected error occurred during payment processing.';
  };

  const getErrorSolution = (code) => {
    const solutions = {
      'PAYMENT_FAILED': [
        'Check your internet connection',
        'Verify your card details are correct',
        'Try a different payment method',
        'Contact your bank if the issue persists'
      ],
      'INSUFFICIENT_FUNDS': [
        'Check your account balance',
        'Add funds to your account',
        'Try a different card or payment method'
      ],
      'CARD_DECLINED': [
        'Contact your bank to authorize the transaction',
        'Check if your card is activated for online payments',
        'Try a different card',
        'Use UPI or net banking instead'
      ],
      'NETWORK_ERROR': [
        'Check your internet connection',
        'Try again after a few minutes',
        'Switch to a different network if possible'
      ],
      'BANK_ERROR': [
        'Wait for a few minutes and try again',
        'Try during non-peak hours',
        'Use a different payment method'
      ],
      'INVALID_CARD': [
        'Double-check your card number',
        'Verify the expiry date and CVV',
        'Make sure your name matches the card'
      ],
      'EXPIRED_CARD': [
        'Use a different card',
        'Contact your bank for a new card'
      ],
      'USER_CANCELLED': [
        'Complete the payment process',
        'Don\'t close the payment window during processing'
      ]
    };
    
    return solutions[code] || [
      'Try again after a few minutes',
      'Use a different payment method',
      'Contact our support team if the issue persists'
    ];
  };

  const retryPayment = async () => {
    setRetryLoading(true);
    try {
      // Navigate back to checkout to retry payment
      navigate('/user/checkout');
      toast.info('Redirecting to checkout. Please try your payment again.');
    } catch (error) {
      toast.error('Failed to redirect to checkout');
    } finally {
      setRetryLoading(false);
    }
  };

  const contactSupport = () => {
    // You can implement a support modal or redirect to support page
    toast.info('Redirecting to support...');
    // For now, just show contact info
    toast.info('Contact support at support@scholaro.com or call +91-XXXXXXXXXX');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Failure Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-lg text-gray-600">
            We couldn't process your payment. Don't worry, no money has been charged.
          </p>
        </div>

        {/* Error Details Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">What went wrong?</h2>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-800 mb-1">
                  {getErrorMessage(failureDetails?.errorCode)}
                </h3>
                {failureDetails?.errorDescription && (
                  <p className="text-sm text-red-700">
                    {failureDetails.errorDescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {failureDetails && (
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">Error Code</p>
                <p className="font-semibold text-gray-900">{failureDetails.errorCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold text-gray-900">{failureDetails.timestamp}</p>
              </div>
              {failureDetails.orderId && (
                <div>
                  <p className="text-sm text-gray-600">Order Reference</p>
                  <p className="font-semibold text-gray-900">{failureDetails.orderId}</p>
                </div>
              )}
              {failureDetails.paymentId && (
                <div>
                  <p className="text-sm text-gray-600">Payment ID</p>
                  <p className="font-semibold text-gray-900">{failureDetails.paymentId}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Solutions Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">How to fix this?</h2>
          </div>

          <div className="space-y-3">
            {getErrorSolution(failureDetails?.errorCode).map((solution, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700">{solution}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button
            onClick={retryPayment}
            disabled={retryLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retryLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Try Payment Again
          </button>
          
          <Link
            to="/user/cart"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <ShoppingCart className="h-4 w-4" />
            Back to Cart
          </Link>
          
          <button
            onClick={contactSupport}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <HelpCircle className="h-4 w-4" />
            Contact Support
          </button>
        </div>

       
        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-6 w-6 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
              <p className="text-blue-700 mb-3">
                If you continue to face issues with payment, our support team is here to help you.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 text-sm">
                <span className="text-blue-700">
                  <strong>Email:</strong> support@scholaro.com
                </span>
                <span className="text-blue-700">
                  <strong>Phone:</strong> +91-XXXXXXXXXX
                </span>
                <span className="text-blue-700">
                  <strong>Hours:</strong> 9 AM - 6 PM (Mon-Fri)
                </span>
              </div>
            </div>
          </div>
        </div>


      </div>
      
      <Footer />
    </div>
  );
}