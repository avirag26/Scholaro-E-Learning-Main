import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminAPI } from "../api/axiosConfig";

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.all) queryParams.append('all', 'true');

      const response = await adminAPI.get(`/api/admin/categories?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await adminAPI.post('/api/admin/addcategory', {
        title: categoryData.name,
        description: categoryData.description
      });
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateCategoryAPI = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.put(`/api/admin/categories/${id}`, {
        title: categoryData.name,
        description: categoryData.description
      });
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

export const toggleCategoryListingAPI = createAsyncThunk(
  'categories/toggleListing',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await adminAPI.delete(`/api/admin/categories/${categoryId}`);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

export const toggleCategoryVisibilityAPI = createAsyncThunk(
  'categories/toggleVisibility',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await adminAPI.patch(`/api/admin/categories/${categoryId}/toggle-visibility`);
      return response.data.category;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle category visibility');
    }
  }
);

const categorySlice = createSlice({
  name: "category",
  initialState: {
    categoryDatas: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNextPage: false,
      hasPrevPage: false
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearCategories: (state) => {
      state.categoryDatas = [];
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false
      };
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categoryDatas = action.payload.categories.map(category => ({
          ...category,
          name: category.title
        }));
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        const newCategory = {
          ...action.payload,
          id: action.payload._id,
          name: action.payload.title
        };
        state.categoryDatas.push(newCategory);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      .addCase(updateCategoryAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategoryAPI.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCategory = {
          ...action.payload,
          id: action.payload._id,
          name: action.payload.title
        };
        state.categoryDatas = state.categoryDatas.map(category =>
          category.id === updatedCategory.id ? updatedCategory : category
        );
      })
      .addCase(updateCategoryAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      .addCase(toggleCategoryListingAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleCategoryListingAPI.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCategory = {
          ...action.payload,
          id: action.payload._id,
          name: action.payload.title
        };
        state.categoryDatas = state.categoryDatas.map(category =>
          category.id === updatedCategory.id ? updatedCategory : category
        );
      })
      .addCase(toggleCategoryListingAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      .addCase(toggleCategoryVisibilityAPI.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleCategoryVisibilityAPI.fulfilled, (state, action) => {
        const updatedCategory = {
          ...action.payload,
          id: action.payload._id,
          name: action.payload.title
        };
        state.categoryDatas = state.categoryDatas.map(category =>
          category.id === updatedCategory.id ? updatedCategory : category
        );
      })
      .addCase(toggleCategoryVisibilityAPI.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearCategories,
  clearError
} = categorySlice.actions;


export default categorySlice.reducer;