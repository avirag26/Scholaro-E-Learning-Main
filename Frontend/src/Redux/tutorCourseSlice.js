import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { tutorAPI } from "../api/axiosConfig";

// Async thunks for API calls
export const fetchTutorCourses = createAsyncThunk(
  'tutorCourses/fetchCourses',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 6, search = '', status = 'all' } = params;
      const response = await tutorAPI.get('/api/tutors/courses', {
        params: { page, limit, search, status }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const createCourse = createAsyncThunk(
  'tutorCourses/createCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await tutorAPI.post('/api/tutors/courses', courseData);
      return response.data.course;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create course');
    }
  }
);

export const updateCourse = createAsyncThunk(
  'tutorCourses/updateCourse',
  async ({ id, courseData }, { rejectWithValue }) => {
    try {
      const response = await tutorAPI.put(`/api/tutors/courses/${id}`, courseData);
      return response.data.course;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update course');
    }
  }
);

export const toggleCourseListing = createAsyncThunk(
  'tutorCourses/toggleListing',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await tutorAPI.patch(`/api/tutors/courses/${courseId}/toggle-listing`);
      return response.data.course;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update course listing');
    }
  }
);

export const fetchCourseDetails = createAsyncThunk(
  'tutorCourses/fetchCourseDetails',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await tutorAPI.get(`/api/tutors/courses/${courseId}`);
      return response.data.course;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch course details');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'tutorCourses/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorAPI.get('/api/tutors/categories');
      return response.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

const tutorCourseSlice = createSlice({
  name: "tutorCourses",
  initialState: {
    courses: [],
    categories: [],
    selectedCourse: null,
    pagination: null,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
    setSelectedCourse: (state, action) => {
      state.selectedCourse = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Courses
      .addCase(fetchTutorCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTutorCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.courses;
        state.pagination = action.payload.pagination;
        state.stats = action.payload.stats;
      })
      .addCase(fetchTutorCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Course
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses.unshift(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Course
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCourse = action.payload;
        state.courses = state.courses.map(course =>
          course.id === updatedCourse._id ? { ...updatedCourse, id: updatedCourse._id } : course
        );
        if (state.selectedCourse && state.selectedCourse.id === updatedCourse._id) {
          state.selectedCourse = { ...updatedCourse, id: updatedCourse._id };
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle Course Listing
      .addCase(toggleCourseListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleCourseListing.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCourse = action.payload;
        state.courses = state.courses.map(course =>
          course.id === updatedCourse._id ? { ...updatedCourse, id: updatedCourse._id } : course
        );
      })
      .addCase(toggleCourseListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Course Details
      .addCase(fetchCourseDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCourse = { ...action.payload, id: action.payload._id };
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSelectedCourse,
  setSelectedCourse
} = tutorCourseSlice.actions;

export default tutorCourseSlice.reducer;