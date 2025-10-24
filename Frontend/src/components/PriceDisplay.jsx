import React from 'react';
import { calculatePrice } from '../utils/priceUtils';

/**
 * Price display component with proper formatting
 * @param {number} price - Original price
 * @param {number} offerPercentage - Discount percentage (0-100)
 * @returns {JSX.Element} Formatted price component
 */
const PriceDisplay = ({ price, offerPercentage = 0 }) => {
  const priceData = calculatePrice(price, offerPercentage);
  
  if (priceData.hasOffer) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-green-600">
          ₹{priceData.discountedPrice.toFixed(0)}
        </span>
        <span className="text-sm text-gray-500 line-through">
          ₹{priceData.originalPrice.toFixed(0)}
        </span>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
          {priceData.offerPercentage}% OFF
        </span>
      </div>
    );
  }
  
  return (
    <span className="text-lg font-bold text-gray-900">
      ₹{priceData.originalPrice.toFixed(0)}
    </span>
  );
};

export default PriceDisplay;