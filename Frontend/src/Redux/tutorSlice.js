import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminAPI } from "../api/axiosConfig";
export const fetchTutors = createAsyncThunk(
  "tutors/fetchTutors",
  async ({ page = 1, search = '', status = 'all' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        status
      });
      const { data } = await adminAPI.get(`/api/admin/tutors?${params}`);
      return data;
    }
    catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching tutors"
      );
    }
  });
const tutorSlice = createSlice({
  name: "tutors",
  initialState: {
    tutors: [],
    pagination: null,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    updateTutorStatus: (state, action) => {
      const { userId, isBlocked } = action.payload;
      const tutorIndex = state.tutors.findIndex(tutor => tutor._id === userId);
      if (tutorIndex !== -1) {
        state.tutors[tutorIndex].is_blocked = isBlocked;
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
      .addCase(fetchTutors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTutors.fulfilled, (state, action) => {
        state.loading = false;
        state.tutors = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
        state.stats = action.payload.stats || null;
        state.error = null;
      })
      .addCase(fetchTutors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
})

export const { updateTutorStatus } = tutorSlice.actions;
export default tutorSlice.reducer;
