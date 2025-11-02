# Unavailable Courses Handling in Cart System

## Overview
This implementation handles the scenario where courses in a user's cart become unavailable due to admin/tutor unlisting them. The system provides proper visual feedback and prevents unavailable courses from being purchased.

## Features Implemented

### 1. Frontend Cart Display
- **Visual Indicators**: Unavailable courses are shown with:
  - Grayed out appearance with reduced opacity
  - Red background highlighting
  - "Unavailable" overlay on course thumbnail
  - "Course no longer available" badge
  - Disabled pricing display

- **Notification Banner**: Shows count of unavailable courses with option to remove them
- **Remove Unavailable Button**: One-click removal of all unavailable courses

### 2. Checkout Protection
- **Availability Validation**: Only available courses are included in checkout calculations
- **Price Calculations**: Totals exclude unavailable courses
- **Payment Prevention**: Cannot proceed to payment with only unavailable courses
- **User Feedback**: Clear messaging about excluded courses

### 3. Backend Validation
- **Course Availability Check**: Validates `listed`, `isActive`, and `!isBanned` status
- **Payment Protection**: Payment controller filters out unavailable courses before processing
- **Cart Totals**: Automatically recalculates totals excluding unavailable items

### 4. Automatic Cleanup
- **Real-time Cleanup**: When admin/tutor unlists a course, it's automatically removed from all carts and wishlists
- **Manual Cleanup**: Users can manually remove unavailable courses from their cart
- **Admin Cleanup**: Admin can clean up all carts system-wide

## API Endpoints

### User Endpoints
- `DELETE /api/users/cart/cleanup-unavailable` - Remove unavailable courses from user's cart

### Admin Endpoints  
- `DELETE /api/admin/carts/cleanup-unavailable` - Clean up unavailable courses from all carts

## Course Availability Criteria
A course is considered **unavailable** if any of the following is true:
- `course.listed = false` (unlisted by admin or tutor)
- `course.isActive = false` (deactivated)
- `course.isBanned = true` (banned by admin)

## User Experience Flow

### Cart Page
1. User sees their cart with both available and unavailable courses
2. Unavailable courses are clearly marked and excluded from totals
3. User can remove unavailable courses with one click
4. Available courses can still be moved to wishlist or removed individually

### Checkout Page
1. Only available courses are shown in order summary
2. Unavailable courses are mentioned in notification
3. Pricing calculations exclude unavailable items
4. Cannot proceed if no available courses remain

### Payment Processing
1. Backend validates course availability before creating payment order
2. Only available courses are included in the final order
3. Payment amount reflects only available courses
4. User enrollment happens only for available courses

## Error Handling
- Graceful degradation when courses become unavailable
- Clear error messages for users
- Automatic cleanup prevents stale data
- Payment validation prevents invalid transactions

## Benefits
- **User Clarity**: Users always know which courses they can actually purchase
- **Data Integrity**: No stale unavailable courses in carts
- **Payment Security**: Cannot accidentally charge for unavailable courses
- **Admin Control**: Admins can manage course availability effectively
- **Automatic Maintenance**: System self-maintains cart cleanliness