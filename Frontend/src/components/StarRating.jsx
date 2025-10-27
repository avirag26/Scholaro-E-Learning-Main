import { Star } from 'lucide-react';
/**
 * Reusable star rating component
 * @param {number} rating - Rating value (0-5)
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @param {boolean} showValue - Whether to show the rating value
 * @param {number} totalReviews - Total number of reviews
 * @returns {JSX.Element} Star rating component
 */
const StarRating = ({ 
  rating = 0, 
  size = 'md', 
  showValue = false, 
  totalReviews = 0 
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  const starSize = sizeClasses[size] || sizeClasses.md;
  const textSize = textSizeClasses[size] || textSizeClasses.md;
  const renderStars = () => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${starSize} ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {renderStars()}
      </div>
      {showValue && (
        <span className={`${textSize} text-gray-600 ml-1`}>
          {rating.toFixed(1)}
          {totalReviews > 0 && ` (${totalReviews})`}
        </span>
      )}
    </div>
  );
};
export default StarRating;
