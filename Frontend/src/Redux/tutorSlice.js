import {createSlice , createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";

export const fetchTutors = createAsyncThunk(
    "tutors/fetchTutors",
    async ({ page = 1 ,search='',status='all'}={},{rejectWithValue})=>{
        try{
            const adminToken = localStorage.getItem('adminAuthToken');

            if(!adminToken){
                return rejectWithValue("No admin token found. Please login again.");
            }
            const params = new URLSearchParams({
                page:page.toString(),
                search,
                status
            });
             const { data } = await axios.get(`http://localhost:5000/api/admin/tutors?${params}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

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
     name:"tutors",
     initialState:{
    tutors: [],
    pagination: null,
    stats: null,
    loading: false,
    error: null,
     },
     reducers:{},
     extraReducers:(builder)=>{
        builder
        .addCase(fetchTutors.fulfilled,(state,action)=>{
          state.loading= false;
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