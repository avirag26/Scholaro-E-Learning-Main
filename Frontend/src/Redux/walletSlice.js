import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tutorAPI, adminAPI } from '../api/axiosConfig';

// Get wallet details
export const getWallet = createAsyncThunk(
  'wallet/getWallet',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const isTutor = state.currentTutor?.isAuthenticated;
      const isAdmin = state.currentAdmin?.isAuthenticated;
      
      let api, endpoint;
      if (isTutor) {
        api = tutorAPI;
        endpoint = '/api/tutors/wallet';
      } else if (isAdmin) {
        api = adminAPI;
        endpoint = '/api/admin/wallet';
      } else {
        throw new Error('Unauthorized access');
      }
      
      const response = await api.get(endpoint);
      return response.data.wallet;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet');
    }
  }
);

// Get wallet transactions
export const getWalletTransactions = createAsyncThunk(
  'wallet/getWalletTransactions',
  async ({ page = 1, limit = 20, type, startDate, endDate } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const isTutor = state.currentTutor?.isAuthenticated;
      const isAdmin = state.currentAdmin?.isAuthenticated;
      
      let api, endpoint;
      if (isTutor) {
        api = tutorAPI;
        endpoint = '/api/tutors/wallet/transactions';
      } else if (isAdmin) {
        api = adminAPI;
        endpoint = '/api/admin/wallet/transactions';
      } else {
        throw new Error('Unauthorized access');
      }
      
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (type) params.append('type', type);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`${endpoint}?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

// Update bank details
export const updateBankDetails = createAsyncThunk(
  'wallet/updateBankDetails',
  async (bankDetails, { rejectWithValue }) => {
    try {
      const response = await tutorAPI.put('/api/tutors/wallet/bank-details', bankDetails);
      return response.data.bankDetails;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update bank details');
    }
  }
);

// Request withdrawal
export const requestWithdrawal = createAsyncThunk(
  'wallet/requestWithdrawal',
  async ({ amount }, { rejectWithValue }) => {
    try {
      const response = await tutorAPI.post('/api/tutors/wallet/withdraw', { amount });
      return response.data.transaction;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request withdrawal');
    }
  }
);

// Get wallet statistics (admin only)
export const getWalletStatistics = createAsyncThunk(
  'wallet/getWalletStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.get('/api/admin/wallet/statistics');
      return response.data.statistics;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    // Wallet data
    balance: 0,
    totalEarnings: 0,
    totalWithdrawals: 0,
    pendingAmount: 0,
    bankDetails: null,
    withdrawalSettings: null,
    recentTransactions: [],
    isActive: true,
    
    // Transactions
    transactions: [],
    transactionsPagination: null,
    
    // Statistics (admin)
    statistics: null,
    
    // UI state
    loading: false,
    transactionsLoading: false,
    statisticsLoading: false,
    error: null,
    
    // Action states
    updatingBankDetails: false,
    requestingWithdrawal: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    clearWalletData: (state) => {
      state.balance = 0;
      state.totalEarnings = 0;
      state.totalWithdrawals = 0;
      state.pendingAmount = 0;
      state.bankDetails = null;
      state.withdrawalSettings = null;
      state.recentTransactions = [];
      state.transactions = [];
      state.transactionsPagination = null;
      state.statistics = null;
    },
    
    // Real-time wallet updates (for socket events)
    updateBalance: (state, action) => {
      state.balance = action.payload.balance;
      state.totalEarnings = action.payload.totalEarnings;
      state.totalWithdrawals = action.payload.totalWithdrawals;
      state.pendingAmount = action.payload.pendingAmount;
    },
    
    addTransaction: (state, action) => {
      const newTransaction = action.payload;
      
      // Add to recent transactions (keep only last 10)
      state.recentTransactions.unshift(newTransaction);
      if (state.recentTransactions.length > 10) {
        state.recentTransactions = state.recentTransactions.slice(0, 10);
      }
      
      // Add to all transactions if they're loaded
      if (state.transactions.length > 0) {
        state.transactions.unshift(newTransaction);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get wallet
      .addCase(getWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWallet.fulfilled, (state, action) => {
        state.loading = false;
        const wallet = action.payload;
        state.balance = wallet.balance;
        state.totalEarnings = wallet.totalEarnings;
        state.totalWithdrawals = wallet.totalWithdrawals;
        state.pendingAmount = wallet.pendingAmount;
        state.bankDetails = wallet.bankDetails;
        state.withdrawalSettings = wallet.withdrawalSettings;
        state.recentTransactions = wallet.recentTransactions;
        state.isActive = wallet.isActive;
      })
      .addCase(getWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get wallet transactions
      .addCase(getWalletTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.error = null;
      })
      .addCase(getWalletTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload.transactions;
        state.transactionsPagination = action.payload.pagination;
      })
      .addCase(getWalletTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.error = action.payload;
      })
      
      // Update bank details
      .addCase(updateBankDetails.pending, (state) => {
        state.updatingBankDetails = true;
        state.error = null;
      })
      .addCase(updateBankDetails.fulfilled, (state, action) => {
        state.updatingBankDetails = false;
        state.bankDetails = action.payload;
      })
      .addCase(updateBankDetails.rejected, (state, action) => {
        state.updatingBankDetails = false;
        state.error = action.payload;
      })
      
      // Request withdrawal
      .addCase(requestWithdrawal.pending, (state) => {
        state.requestingWithdrawal = true;
        state.error = null;
      })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.requestingWithdrawal = false;
        const transaction = action.payload;
        
        // Update balance (subtract withdrawal amount)
        state.balance -= transaction.amount;
        state.pendingAmount += transaction.amount;
        
        // Add transaction to recent transactions
        state.recentTransactions.unshift(transaction);
        if (state.recentTransactions.length > 10) {
          state.recentTransactions = state.recentTransactions.slice(0, 10);
        }
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.requestingWithdrawal = false;
        state.error = action.payload;
      })
      
      // Get wallet statistics
      .addCase(getWalletStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.error = null;
      })
      .addCase(getWalletStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statistics = action.payload;
      })
      .addCase(getWalletStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  clearWalletData, 
  updateBalance, 
  addTransaction 
} = walletSlice.actions;

export default walletSlice.reducer;