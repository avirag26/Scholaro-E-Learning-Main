
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


export const formatPrice = (price, offerPercentage = 0) => {
  const priceData = calculatePrice(price, offerPercentage);
  
  if (priceData.hasOffer) {
    return `₹${priceData.discountedPrice.toFixed(0)} (${priceData.offerPercentage}% OFF from ₹${priceData.originalPrice.toFixed(0)})`;
  }
  
  return `₹${priceData.originalPrice.toFixed(0)}`;
};


export const getFinalPrice = (price, offerPercentage = 0) => {
  const priceData = calculatePrice(price, offerPercentage);
  return priceData.discountedPrice;
};


export const getSavings = (price, offerPercentage = 0) => {
  const priceData = calculatePrice(price, offerPercentage);
  return priceData.savings;
};