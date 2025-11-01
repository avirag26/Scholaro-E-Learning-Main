import { userAPI } from '../api/axiosConfig';

// Cart API calls
export const cartAPI = {
  getCart: () => userAPI.get('/api/users/cart'),
  addToCart: (courseId) => userAPI.post('/api/users/cart/add', { courseId }),
  removeFromCart: (courseId) => userAPI.delete(`/api/users/cart/remove/${courseId}`),
  clearCart: () => userAPI.delete('/api/users/cart/clear'),
  moveToWishlist: (courseId) => userAPI.post('/api/users/cart/move-to-wishlist', { courseId })
};

// Wishlist API calls
export const wishlistAPI = {
  getWishlist: () => userAPI.get('/api/users/wishlist'),
  addToWishlist: (courseId) => userAPI.post('/api/users/wishlist/add', { courseId }),
  removeFromWishlist: (courseId) => userAPI.delete(`/api/users/wishlist/remove/${courseId}`),
  clearWishlist: () => userAPI.delete('/api/users/wishlist/clear'),
  moveToCart: (courseId) => userAPI.post('/api/users/wishlist/move-to-cart', { courseId })
};