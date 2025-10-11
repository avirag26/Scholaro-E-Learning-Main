import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk to fetch users with pagination
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async ({ page = 1, search = '', status = 'all' } = {}, { rejectWithValue }) => {
    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem('adminAuthToken');
      
      if (!adminToken) {
        return rejectWithValue("No admin token found. Please login again.");
      }

      const params = new URLSearchParams({
        page: page.toString(),
        search,
        status
      });

      const { data } = await axios.get(`http://localhost:5000/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      
      return data;
    } catch (error) {
      console.error("Fetch users error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Error fetching users"
      );
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    pagination: null,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
        state.stats = action.payload.stats || null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;
