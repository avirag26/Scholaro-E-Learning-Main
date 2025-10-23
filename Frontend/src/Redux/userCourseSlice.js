import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userAPI } from "../api/axiosConfig";


export const fetchPublicCategories = createAsyncThunk(
  'userCourses/fetchPublicCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.get('/api/users/categories');
      return response.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchPublicCourses = createAsyncThunk(
  'userCourses/fetchPublicCourses',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.category) queryParams.append('category', params.category);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice);
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
      if (params.rating) queryParams.append('rating', params.rating);
      if (params.sort) queryParams.append('sort', params.sort);

      const response = await userAPI.get(`/api/users/courses?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const fetchCoursesByCategory = createAsyncThunk(
  'userCourses/fetchCoursesByCategory',
  async ({ categoryId, params = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.sort) queryParams.append('sort', params.sort);

      const response = await userAPI.get(`/api/users/courses/category/${categoryId}?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses by category');
    }
  }
);

export const fetchCourseDetails = createAsyncThunk(
  'userCourses/fetchCourseDetails',
  async (courseId, { rejectWithValue }) => {
    try {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      
      const response = await userAPI.get(`/api/users/courses/${courseId}`);
      
      if (!response.data || !response.data.course) {
        throw new Error('Invalid response format');
      }
      
      return response.data.course;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch course details';
      return rejectWithValue(errorMessage);
    }
  }
);

const userCourseSlice = createSlice({
  name: "userCourses",
  initialState: {
    categories: [],
    courses: [],
    selectedCourse: null,
    selectedCategory: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNext: false,
      hasPrev: false
    },
    filters: {
      search: '',
      category: '',
      minPrice: null,
      maxPrice: null,
      rating: null,
      sort: 'newest'
    },
    loading: false,
    categoriesLoading: false,
    courseDetailsLoading: false,
    error: null,
  },
  reducers: {
    clearCourses: (state) => {
      state.courses = [];
      state.error = null;
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        search: '',
        category: '',
        minPrice: null,
        maxPrice: null,
        rating: null,
        sort: 'newest'
      };
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchPublicCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchPublicCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.payload;
      })


      .addCase(fetchPublicCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.courses;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPublicCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      .addCase(fetchCoursesByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.courses;
        state.selectedCategory = action.payload.category;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCoursesByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      .addCase(fetchCourseDetails.pending, (state) => {
        state.courseDetailsLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.courseDetailsLoading = false;
        state.selectedCourse = action.payload;
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => {
        state.courseDetailsLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCourses,
  clearSelectedCourse,
  clearError,
  setFilters,
  resetFilters,
  setSelectedCategory
} = userCourseSlice.actions;

export default userCourseSlice.reducer;