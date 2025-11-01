import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../api/axiosConfig';

// Get wishlist
export const getWishlist = createAsyncThunk(
  'wishlist/getWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.get('/api/users/wishlist');
      return response.data.wishlist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

// Add to wishlist
export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await userAPI.post('/api/users/wishlist/add', { courseId });
      return response.data.wishlist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

// Remove from wishlist
export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await userAPI.delete(`/api/users/wishlist/remove/${courseId}`);
      return response.data.wishlist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

// Move to cart
export const moveToCart = createAsyncThunk(
  'wishlist/moveToCart',
  async (courseId, { rejectWithValue }) => {
    try {
      await userAPI.post('/api/users/wishlist/move-to-cart', { courseId });
      return courseId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to move to cart');
    }
  }
);

// Clear wishlist
export const clearWishlist = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.delete('/api/users/wishlist/clear');
      return response.data.wishlist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear wishlist');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
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
      // Get wishlist
      .addCase(getWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(getWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Clear wishlist
      .addCase(clearWishlist.fulfilled, (state) => {
        state.items = [];
      })
      
      // Move to cart
      .addCase(moveToCart.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.course._id !== action.payload);
      });
  }
});

export const { clearError } = wishlistSlice.actions;
export default wishlistSlice.reducer;