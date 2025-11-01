// Utility functions for cart and wishlist components

export const calculateDiscountedPrice = (price, offerPercentage) => {
    if (!offerPercentage || offerPercentage === 0) return price;
    return price - (price * offerPercentage / 100);
};

export const formatPrice = (price) => {
    return `₹${price.toFixed(2)}`;
};

export const calculateSavings = (originalPrice, discountedPrice) => {
    return originalPrice - discountedPrice;
};

export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Component for displaying course rating stars
export const StarRating = ({ rating, totalReviews, className = "" }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(
                <span key={i} className="text-yellow-400">★</span>
            );
        } else if (i === fullStars && hasHalfStar) {
            stars.push(
                <span key={i} className="text-yellow-400">☆</span>
            );
        } else {
            stars.push(
                <span key={i} className="text-gray-300">★</span>
            );
        }
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex">
                {stars}
            </div>
            <span className="text-sm text-gray-600 ml-1">
                {rating?.toFixed(1) || '0.0'} ({totalReviews || 0} reviews)
            </span>
        </div>
    );
};

// Component for displaying price with discount
export const PriceDisplay = ({ price, offerPercentage, className = "" }) => {
    const discountedPrice = calculateDiscountedPrice(price, offerPercentage);
    const hasDiscount = offerPercentage && offerPercentage > 0;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-xl font-bold text-gray-900">
                {formatPrice(discountedPrice)}
            </span>
            {hasDiscount && (
                <>
                    <span className="text-sm text-gray-500 line-through">
                        {formatPrice(price)}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                        {offerPercentage}% off
                    </span>
                </>
            )}
        </div>
    );
};

// Empty state component
export const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionText,
    onAction,
    className = ""
}) => {
    return (
        <div className={`text-center py-12 ${className}`}>
            <Icon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{description}</p>
            {actionText && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center px-6 py-3 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors"
                >
                    {actionText}
                </button>
            )}
        </div>
    );
};