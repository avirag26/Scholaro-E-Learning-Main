import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../api/axiosConfig';

// Get cart
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.get('/api/users/cart');
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

// Add to cart
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await userAPI.post('/api/users/cart/add', { courseId });
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

// Remove from cart
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await userAPI.delete(`/api/users/cart/remove/${courseId}`);
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

// Clear cart
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.delete('/api/users/cart/clear');
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

// Move to wishlist
export const moveToWishlist = createAsyncThunk(
  'cart/moveToWishlist',
  async (courseId, { rejectWithValue }) => {
    try {
      await userAPI.post('/api/users/cart/move-to-wishlist', { courseId });
      return courseId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to move to wishlist');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
    totalItems: 0,
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get cart
      .addCase(getCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalAmount = action.payload.totalAmount || 0;
        state.totalItems = action.payload.totalItems || 0;
      })
      .addCase(getCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalAmount = action.payload.totalAmount || 0;
        state.totalItems = action.payload.totalItems || 0;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.totalAmount = action.payload.totalAmount || 0;
        state.totalItems = action.payload.totalItems || 0;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Clear cart
      .addCase(clearCart.fulfilled, (state, action) => {
        state.items = [];
        state.totalAmount = 0;
        state.totalItems = 0;
      })
      
      // Move to wishlist
      .addCase(moveToWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.course._id !== action.payload);
        state.totalItems = state.items.length;
        state.totalAmount = state.items.reduce((total, item) => {
          const price = item.course.price;
          const discount = item.course.offer_percentage || 0;
          const finalPrice = price - (price * discount / 100);
          return total + finalPrice;
        }, 0);
      });
  }
});

export const { clearError } = cartSlice.actions;
export default cartSlice.reducer;