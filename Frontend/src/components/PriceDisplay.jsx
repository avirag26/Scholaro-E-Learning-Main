import React from 'react';
import { calculatePrice } from '../utils/priceUtils';
import { CURRENCY } from '../constants/defaults';
/**
 * Price display component with proper formatting
 * @param {number} price - Original price
 * @param {number} offerPercentage - Discount percentage (0-100)
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @returns {JSX.Element} Formatted price component
 */
const PriceDisplay = ({ price, offerPercentage = 0, size = 'md' }) => {
  const priceData = calculatePrice(price, offerPercentage);
  const sizeClasses = {
    sm: {
      price: 'text-sm font-bold',
      originalPrice: 'text-xs',
      badge: 'text-xs px-1.5 py-0.5'
    },
    md: {
      price: 'text-lg font-bold',
      originalPrice: 'text-sm',
      badge: 'text-xs px-2 py-1'
    },
    lg: {
      price: 'text-xl font-bold',
      originalPrice: 'text-base',
      badge: 'text-sm px-3 py-1'
    }
  };
  const classes = sizeClasses[size] || sizeClasses.md;
  if (priceData.hasOffer) {
    return (
      <div className="flex items-center gap-1">
        <span className={`${classes.price} text-green-600`}>
          {CURRENCY.SYMBOL}{priceData.discountedPrice.toFixed(0)}
        </span>
        <span className={`${classes.originalPrice} text-gray-500 line-through`}>
          {CURRENCY.SYMBOL}{priceData.originalPrice.toFixed(0)}
        </span>
        <span className={`${classes.badge} bg-red-100 text-red-600 rounded-full`}>
          {priceData.offerPercentage}% OFF
        </span>
      </div>
    );
  }
  return (
    <span className={`${classes.price} text-gray-900`}>
      {CURRENCY.SYMBOL}{priceData.originalPrice.toFixed(0)}
    </span>
  );
};
export default PriceDisplay;
