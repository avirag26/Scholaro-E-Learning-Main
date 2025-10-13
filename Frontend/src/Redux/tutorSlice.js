import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axios";

export const fetchTutors = createAsyncThunk(
  "tutors/fetchTutors",
  async ({ page = 1, search = '', status = 'all' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        status
      });
      const { data } = await axiosInstance.get(`/api/admin/tutors?${params}`);

      return data;

    }
    catch (error) {
      console.error("Fetch tutors error:", error);
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTutors.fulfilled, (state, action) => {
        state.loading = false;
        state.tutors = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
        state.stats = action.payload.stats || null;
      })
      .addCase(fetchTutors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
})

export default tutorSlice.reducer;