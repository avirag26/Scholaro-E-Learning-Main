import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminAPI } from "../api/axiosConfig";
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async ({ page = 1, search = "", status = "all" } = {}, { rejectWithValue }) => {
    try {
      const res = await adminAPI.get("/api/admin/users", {
        params: { page, search, status },
      });
      return res.data;
    } catch (err) {
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
  reducers: {
    updateUserStatus: (state, action) => {
      const { userId, isBlocked } = action.payload;
      const userIndex = state.users.findIndex(user => user._id === userId);
      if (userIndex !== -1) {
        state.users[userIndex].is_blocked = isBlocked;
      }
      // Update stats
      if (state.stats) {
        if (isBlocked) {
          state.stats.listed = Math.max(0, state.stats.listed - 1);
          state.stats.unlisted = (state.stats.unlisted || 0) + 1;
        } else {
          state.stats.unlisted = Math.max(0, state.stats.unlisted - 1);
          state.stats.listed = (state.stats.listed || 0) + 1;
        }
      }
    }
  },
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

export const { updateUserStatus } = userSlice.actions;
export default userSlice.reducer;
