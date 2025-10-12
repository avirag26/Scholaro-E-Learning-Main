import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// fetching all users
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async ({ page = 1, search = "", status = "all" } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("adminAuthToken");
      if (!token) {
        return rejectWithValue("No admin token found. Please login again.");
      }

      // send request to backend
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { page, search, status },
      });

      return res.data;
    } catch (err) {
      console.log("Error while fetching users:", err);
      return rejectWithValue(err.response?.data?.message || "Something went wrong");
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
