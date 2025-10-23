/**
 * Calculate discounted price based on offer percentage
 * @param {number} price - Original price
 * @param {number} offerPercentage - Discount percentage (0-100)
 * @returns {object} Price calculation results
 */
export const calculatePrice = (price, offerPercentage = 0) => {
  const originalPrice = parseFloat(price) || 0;
  const discount = parseFloat(offerPercentage) || 0;
  
  if (discount > 0 && discount <= 100) {
    const discountAmount = (originalPrice * discount) / 100;
    const discountedPrice = originalPrice - discountAmount;
    
    return {
      hasOffer: true,
      originalPrice: originalPrice,
      discountedPrice: discountedPrice,
      discountAmount: discountAmount,
      offerPercentage: discount,
      savings: discountAmount
    };
  }
  
  return {
    hasOffer: false,
    originalPrice: originalPrice,
    discountedPrice: originalPrice,
    discountAmount: 0,
    offerPercentage: 0,
    savings: 0
  };
};

/**
 * Format price as plain text (no JSX)
 * @param {number} price - Original price
 * @param {number} offerPercentage - Discount percentage (0-100)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, offerPercentage = 0) => {
  const priceData = calculatePrice(price, offerPercentage);
  
  if (priceData.hasOffer) {
    return `₹${priceData.discountedPrice.toFixed(0)} (${priceData.offerPercentage}% OFF from ₹${priceData.originalPrice.toFixed(0)})`;
  }
  
  return `₹${priceData.originalPrice.toFixed(0)}`;
};

/**
 * Get final price after discount
 * @param {number} price - Original price
 * @param {number} offerPercentage - Discount percentage (0-100)
 * @returns {number} Final price after discount
 */
export const getFinalPrice = (price, offerPercentage = 0) => {
  const priceData = calculatePrice(price, offerPercentage);
  return priceData.discountedPrice;
};

/**
 * Get savings amount
 * @param {number} price - Original price
 * @param {number} offerPercentage - Discount percentage (0-100)
 * @returns {number} Amount saved
 */
export const getSavings = (price, offerPercentage = 0) => {
  const priceData = calculatePrice(price, offerPercentage);
  return priceData.savings;
};