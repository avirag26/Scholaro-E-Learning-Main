import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { publicAPI, tutorAPI } from "../api/axiosConfig";

// PUBLIC COURSE OPERATIONS (for students/users)
export const fetchCoursesByCategory = createAsyncThunk(
  'courses/fetchCoursesByCategory',
  async ({ categoryId, ...params }, { rejectWithValue }) => {
    try {
      const response = await publicAPI.get(`/api/tutors/courses/category/${categoryId}`, {
        params
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses by category');
    }
  }
);

// TUTOR COURSE OPERATIONS (for tutors)
export const fetchTutorCourses = createAsyncThunk(
  'courses/fetchTutorCourses',
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
  'courses/createCourse',
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
  'courses/updateCourse',
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
  'courses/toggleListing',
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
  'courses/fetchCourseDetails',
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
  'courses/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorAPI.get('/api/tutors/categories');
      return response.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

const courseSlice = createSlice({
  name: "courses",
  initialState: {
    // PUBLIC DATA (for students/users)
    publicCourses: (() => {
      try {
        const storedData = localStorage.getItem("publicCourses");
        return storedData ? JSON.parse(storedData) : [];
      } catch (error) {
        console.warn("Error parsing public courses from localStorage:", error);
        localStorage.removeItem("publicCourses");
        return [];
      }
    })(),
    
    // TUTOR DATA (for tutors)
    tutorCourses: [],
    categories: [],
    
    // SHARED DATA
    selectedCourse: null,
    pagination: null,
    stats: null,
    
    // USER PROGRESS (for students)
    userProgress: (() => {
      try {
        const storedProgress = localStorage.getItem("userProgress");
        return storedProgress ? JSON.parse(storedProgress) : {};
      } catch (error) {
        console.warn("Error parsing user progress from localStorage:", error);
        localStorage.removeItem("userProgress");
        return {};
      }
    })(),
    
    // PRICING
    offerPrices: {},
    
    // UI STATE
    loading: false,
    error: null,
    currentUserId: null,
  },
  
  reducers: {
    // SHARED ACTIONS
    setSelectedCourse: (state, action) => {
      state.selectedCourse = action.payload;
    },
    
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // PUBLIC COURSE ACTIONS
    setPublicCourses: (state, action) => {
      const courses = Array.isArray(action.payload) ? action.payload : [action.payload];
      state.publicCourses = courses.filter(course => course.listed);
      localStorage.setItem("publicCourses", JSON.stringify(state.publicCourses));
    },
    
    clearPublicCourses: (state) => {
      state.publicCourses = [];
      localStorage.removeItem("publicCourses");
    },
    
    // USER PROGRESS ACTIONS
    updateUserProgress: (state, action) => {
      const { courseId, lessonId, progress, userId } = action.payload;
      
      if (!state.userProgress[userId]) {
        state.userProgress[userId] = {};
      }
      
      if (!state.userProgress[userId][courseId]) {
        state.userProgress[userId][courseId] = {};
      }
      
      state.userProgress[userId][courseId][lessonId] = progress;
      localStorage.setItem("userProgress", JSON.stringify(state.userProgress));
    },
    
    loadUserProgress: (state, action) => {
      state.currentUserId = action.payload;
    },
    
    clearUserProgress: (state, action) => {
      const userId = action.payload;
      if (state.userProgress[userId]) {
        delete state.userProgress[userId];
        localStorage.setItem("userProgress", JSON.stringify(state.userProgress));
      }
      state.currentUserId = null;
    },
    
    // PRICING ACTIONS
    setOfferPrice: (state, action) => {
      const { courseId, offerPrice } = action.payload;
      state.offerPrices[courseId] = offerPrice;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // PUBLIC: Fetch Courses by Category
      .addCase(fetchCoursesByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.publicCourses = action.payload.courses || [];
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalItems: action.payload.totalCourses
        };
        localStorage.setItem("publicCourses", JSON.stringify(state.publicCourses));
      })
      .addCase(fetchCoursesByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // TUTOR: Fetch Tutor Courses
      .addCase(fetchTutorCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTutorCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.tutorCourses = action.payload.courses;
        state.pagination = action.payload.pagination;
        state.stats = action.payload.stats;
      })
      .addCase(fetchTutorCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // TUTOR: Create Course
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.tutorCourses.unshift(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // TUTOR: Update Course
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCourse = action.payload;
        state.tutorCourses = state.tutorCourses.map(course =>
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

      // TUTOR: Toggle Course Listing
      .addCase(toggleCourseListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleCourseListing.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCourse = action.payload;
        state.tutorCourses = state.tutorCourses.map(course =>
          course.id === updatedCourse._id ? { ...updatedCourse, id: updatedCourse._id } : course
        );
      })
      .addCase(toggleCourseListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // SHARED: Fetch Course Details
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

      // SHARED: Fetch Categories
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
  setSelectedCourse,
  clearSelectedCourse,
  clearError,
  setLoading,
  setPublicCourses,
  clearPublicCourses,
  updateUserProgress,
  loadUserProgress,
  clearUserProgress,
  setOfferPrice
} = courseSlice.actions;

export default courseSlice.reducer;