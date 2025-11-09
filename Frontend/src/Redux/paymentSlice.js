import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../api/axiosConfig';

// Create Razorpay order
export const createOrder = createAsyncThunk(
  'payment/createOrder',
  async (orderData = {}, { rejectWithValue }) => {
    try {
      const response = await userAPI.post('/api/users/payment/create-order', orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

// Verify payment
export const verifyPayment = createAsyncThunk(
  'payment/verifyPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await userAPI.post('/api/users/payment/verify', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment verification failed');
    }
  }
);

// Get user orders
export const getUserOrders = createAsyncThunk(
  'payment/getUserOrders',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await userAPI.get(`/api/users/payment/orders?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    currentOrder: null,
    orders: [],
    pagination: null,
    loading: false,
    error: null,
    paymentStatus: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPaymentStatus: (state) => {
      state.paymentStatus = null;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.order;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Verify payment
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentStatus = 'success';
        state.currentOrder = null;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.paymentStatus = 'failed';
      })
      
      // Get user orders
      .addCase(getUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(getUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearPaymentStatus, setCurrentOrder } = paymentSlice.actions;
export default paymentSlice.reducer;