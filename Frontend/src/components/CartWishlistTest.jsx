import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCart } from '../Redux/cartSlice';
import { getWishlist } from '../Redux/wishlistSlice';

// This is a test component to verify cart and wishlist API calls work
const CartWishlistTest = () => {
  const dispatch = useDispatch();
  const { items: cartItems, loading: cartLoading, error: cartError } = useSelector(state => state.cart);
  const { items: wishlistItems, loading: wishlistLoading, error: wishlistError } = useSelector(state => state.wishlist);

  useEffect(() => {
    // Test API calls on component mount
    dispatch(getCart());
    dispatch(getWishlist());
  }, [dispatch]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Cart & Wishlist API Test</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded">
          <h4 className="font-semibold mb-2">Cart Status</h4>
          {cartLoading && <p className="text-blue-600">Loading cart...</p>}
          {cartError && <p className="text-red-600">Error: {cartError}</p>}
          {!cartLoading && !cartError && (
            <p className="text-green-600">
              Cart loaded successfully! Items: {cartItems?.length || 0}
            </p>
          )}
        </div>
        
        <div className="bg-white p-4 rounded">
          <h4 className="font-semibold mb-2">Wishlist Status</h4>
          {wishlistLoading && <p className="text-blue-600">Loading wishlist...</p>}
          {wishlistError && <p className="text-red-600">Error: {wishlistError}</p>}
          {!wishlistLoading && !wishlistError && (
            <p className="text-green-600">
              Wishlist loaded successfully! Items: {wishlistItems?.length || 0}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartWishlistTest;