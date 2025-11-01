# Cart and Wishlist Implementation

This document outlines the complete cart and wishlist functionality implemented for the Scholaro e-learning platform.

## Features Implemented

### Backend Features
- **Cart Management**: Add, remove, clear cart items
- **Wishlist Management**: Add, remove, clear wishlist items
- **Cross-functionality**: Move items between cart and wishlist
- **User Authentication**: All endpoints protected with JWT authentication
- **Data Validation**: Prevents duplicate items and validates course existence
- **Automatic Calculations**: Cart totals, item counts, and pricing

### Frontend Features
- **Redux State Management**: Centralized state for cart and wishlist
- **Real-time Updates**: Header icons show current item counts
- **Responsive Design**: Mobile-friendly cart and wishlist pages
- **Interactive Course Cards**: Add to cart/wishlist directly from course listings
- **Search and Filter**: Wishlist page includes search and sorting options
- **Toast Notifications**: User feedback for all actions
- **Loading States**: Visual feedback during API calls

## File Structure

### Backend Files
```
Backend/
├── Model/
│   ├── CartModel.js          # Cart schema and methods
│   └── WishlistModel.js      # Wishlist schema and methods
├── Controllers/
│   ├── cartController.js     # Cart API endpoints
│   └── wishlistController.js # Wishlist API endpoints
├── Routes/
│   ├── cartRoute.js          # Cart routes
│   └── wishlistRoute.js      # Wishlist routes
└── index.js                  # Updated with new routes
```

### Frontend Files
```
Frontend/src/
├── Redux/
│   ├── cartSlice.js          # Cart Redux slice
│   ├── wishlistSlice.js      # Wishlist Redux slice
│   └── store.js              # Updated store configuration
├── Pages/USER/
│   ├── Cart.jsx              # Cart page component
│   ├── Wishlist.jsx          # Wishlist page component
│   ├── CourseListing.jsx     # Updated with cart/wishlist buttons
│   └── Common/Header.jsx     # Updated with cart/wishlist icons
├── components/
│   └── CourseActions.jsx     # Reusable cart/wishlist buttons
├── services/
│   └── cartService.js        # API service functions
└── Routes/userRoutes.jsx     # Updated with new routes
```

## API Endpoints

### Cart Endpoints
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add course to cart
- `DELETE /api/cart/remove/:courseId` - Remove course from cart
- `DELETE /api/cart/clear` - Clear entire cart
- `POST /api/cart/move-to-wishlist` - Move item from cart to wishlist

### Wishlist Endpoints
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist/add` - Add course to wishlist
- `DELETE /api/wishlist/remove/:courseId` - Remove course from wishlist
- `DELETE /api/wishlist/clear` - Clear entire wishlist
- `POST /api/wishlist/move-to-cart` - Move item from wishlist to cart

## Usage Examples

### Adding to Cart (Frontend)
```javascript
import { useDispatch } from 'react-redux';
import { addToCart } from '../Redux/cartSlice';

const dispatch = useDispatch();

const handleAddToCart = async (courseId) => {
  try {
    await dispatch(addToCart(courseId)).unwrap();
    toast.success('Course added to cart');
  } catch (error) {
    toast.error(error);
  }
};
```

### Using CourseActions Component
```javascript
import CourseActions from '../components/CourseActions';

<CourseActions courseId={course.id} className="mt-4" />
```

## Key Features

### Cart Page
- Display all cart items with course details
- Calculate totals including discounts and taxes
- Remove individual items or clear entire cart
- Move items to wishlist
- Proceed to checkout functionality
- Empty cart state with call-to-action

### Wishlist Page
- Display all wishlist items with course details
- Search and filter functionality
- Sort by newest, price, rating
- Add items to cart directly
- Remove items from wishlist
- User profile sidebar navigation
- Empty wishlist state with call-to-action

### Header Integration
- Real-time cart item count badge
- Real-time wishlist item count badge
- Clickable icons navigate to respective pages
- Different colored badges for cart vs wishlist

### Course Listing Integration
- Heart icon for wishlist (filled when in wishlist)
- Add to Cart button (disabled when in cart)
- Hover effects and visual feedback
- Prevents duplicate additions

## Security Features
- JWT authentication required for all endpoints
- User-specific data isolation
- Input validation and sanitization
- Error handling and user feedback

## Performance Optimizations
- Redux state management for efficient updates
- Optimistic UI updates
- Lazy loading of cart/wishlist data
- Efficient re-renders with proper selectors

## Mobile Responsiveness
- Responsive grid layouts
- Touch-friendly buttons and interactions
- Mobile-optimized navigation
- Collapsible filters and search

## Error Handling
- Comprehensive error messages
- Toast notifications for user feedback
- Loading states during API calls
- Graceful fallbacks for failed requests

## Future Enhancements
- Persistent cart across sessions
- Wishlist sharing functionality
- Recently viewed items
- Recommended items based on cart/wishlist
- Bulk operations (select multiple items)
- Save for later functionality in cart