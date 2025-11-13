// Payment error handling utilities

export const PAYMENT_ERROR_CODES = {
  // Razorpay specific errors
  BAD_REQUEST_ERROR: 'INVALID_REQUEST',
  GATEWAY_ERROR: 'GATEWAY_ERROR', 
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Card related errors
  CARD_DECLINED: 'CARD_DECLINED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_CARD: 'INVALID_CARD',
  EXPIRED_CARD: 'EXPIRED_CARD',
  
  // Bank related errors
  BANK_ERROR: 'BANK_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  
  // User actions
  USER_CANCELLED: 'USER_CANCELLED',
  TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',
  
  // System errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED'
};

export const getErrorCodeFromRazorpayError = (razorpayError) => {
  if (!razorpayError) return PAYMENT_ERROR_CODES.PAYMENT_FAILED;
  
  const errorCode = razorpayError.code?.toUpperCase();
  const errorReason = razorpayError.reason?.toUpperCase();
  const errorDescription = razorpayError.description?.toLowerCase() || '';
  
  // Map Razorpay error codes to our error codes
  if (errorCode === 'BAD_REQUEST_ERROR') {
    if (errorDescription.includes('card')) return PAYMENT_ERROR_CODES.INVALID_CARD;
    if (errorDescription.includes('insufficient')) return PAYMENT_ERROR_CODES.INSUFFICIENT_FUNDS;
    return PAYMENT_ERROR_CODES.BAD_REQUEST_ERROR;
  }
  
  if (errorCode === 'GATEWAY_ERROR') return PAYMENT_ERROR_CODES.GATEWAY_ERROR;
  if (errorCode === 'NETWORK_ERROR') return PAYMENT_ERROR_CODES.NETWORK_ERROR;
  if (errorCode === 'SERVER_ERROR') return PAYMENT_ERROR_CODES.SERVER_ERROR;
  
  // Check error reason
  if (errorReason === 'PAYMENT_CANCELLED') return PAYMENT_ERROR_CODES.USER_CANCELLED;
  if (errorReason === 'PAYMENT_TIMEOUT') return PAYMENT_ERROR_CODES.TRANSACTION_TIMEOUT;
  if (errorReason === 'AUTHENTICATION_FAILED') return PAYMENT_ERROR_CODES.AUTHENTICATION_FAILED;
  
  // Check description for specific errors
  if (errorDescription.includes('declined')) return PAYMENT_ERROR_CODES.CARD_DECLINED;
  if (errorDescription.includes('insufficient')) return PAYMENT_ERROR_CODES.INSUFFICIENT_FUNDS;
  if (errorDescription.includes('expired')) return PAYMENT_ERROR_CODES.EXPIRED_CARD;
  if (errorDescription.includes('invalid card')) return PAYMENT_ERROR_CODES.INVALID_CARD;
  if (errorDescription.includes('bank')) return PAYMENT_ERROR_CODES.BANK_ERROR;
  
  return PAYMENT_ERROR_CODES.PAYMENT_FAILED;
};

export const buildFailureUrl = (errorCode, errorDescription, orderId = null, paymentId = null) => {
  const params = new URLSearchParams();
  params.append('error_code', errorCode);
  params.append('error_description', errorDescription);
  
  if (orderId) params.append('order_id', orderId);
  if (paymentId) params.append('payment_id', paymentId);
  
  return `/user/payment-failure?${params.toString()}`;
};

export const handleRazorpayError = (error, navigate, orderId = null) => {
  const errorCode = getErrorCodeFromRazorpayError(error);
  const errorDescription = error.description || error.message || 'Payment processing failed';
  
  const failureUrl = buildFailureUrl(errorCode, errorDescription, orderId, error.payment_id);
  navigate(failureUrl);
};