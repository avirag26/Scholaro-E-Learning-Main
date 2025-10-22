import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminAPI } from "../api/axiosConfig";
// Async thunks for API calls
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.get('/api/admin/categories');
      return response.data.categories;
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

export const deleteCategoryAPI = createAsyncThunk(
  'categories/deleteCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      await adminAPI.delete(`/api/admin/categories/${categoryId}`);
      return categoryId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
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
    loading: false,
    error: null,
  },
  reducers: {
    clearCategories: (state) => {
      state.categoryDatas = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categoryDatas = action.payload.map(category => ({
          ...category,
          id: category._id,
          name: category.title
        }));
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Category
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

      // Update Category
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

      // Delete Category
      .addCase(deleteCategoryAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategoryAPI.fulfilled, (state, action) => {
        state.loading = false;
        state.categoryDatas = state.categoryDatas.filter(category =>
          category.id !== action.payload
        );
      })
      .addCase(deleteCategoryAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle Visibility
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