import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { tutorAPI } from "../api/axiosConfig";
export const createLesson = createAsyncThunk(
    'lessons/createLesson',
    async ({ courseId, lessonData }, { rejectWithValue }) => {
        try {
            const response = await tutorAPI.post(`/api/tutors/lessons/${courseId}`, lessonData);
            return response.data.lesson;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create lesson');
        }
    }
);
export const fetchCourseLessons = createAsyncThunk(
    'lessons/fetchCourseLessons',
    async (courseId, { rejectWithValue }) => {
        try {
            const response = await tutorAPI.get(`/api/tutors/lessons/${courseId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch lessons');
        }
    }
);
export const updateLesson = createAsyncThunk(
    'lessons/updateLesson',
    async ({ lessonId, lessonData }, { rejectWithValue }) => {
        try {
            const response = await tutorAPI.put(`/api/tutors/lessons/${lessonId}`, lessonData);
            return response.data.lesson;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update lesson');
        }
    }
);
export const deleteLesson = createAsyncThunk(
    'lessons/deleteLesson',
    async (lessonId, { rejectWithValue }) => {
        try {
            await tutorAPI.delete(`/api/tutors/lessons/${lessonId}`);
            return lessonId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete lesson');
        }
    }
);
export const fetchLessonDetails = createAsyncThunk(
    'lessons/fetchLessonDetails',
    async (lessonId, { rejectWithValue }) => {
        try {
            const response = await tutorAPI.get(`/api/tutors/lesson/${lessonId}`);
            return response.data.lesson;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch lesson details');
        }
    }
);
const lessonSlice = createSlice({
    name: "lessons",
    initialState: {
        lessons: [],
        selectedLesson: null,
        courseInfo: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedLesson: (state) => {
            state.selectedLesson = null;
        },
        setSelectedLesson: (state, action) => {
            state.selectedLesson = action.payload;
        },
        clearLessons: (state) => {
            state.lessons = [];
            state.courseInfo = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createLesson.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createLesson.fulfilled, (state, action) => {
                state.loading = false;
                const newLesson = {
                    ...action.payload,
                    id: action.payload._id
                };
                state.lessons.push(newLesson);
            })
            .addCase(createLesson.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchCourseLessons.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCourseLessons.fulfilled, (state, action) => {
                state.loading = false;
                state.lessons = action.payload.lessons || [];
                state.courseInfo = action.payload.course;
            })
            .addCase(fetchCourseLessons.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateLesson.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateLesson.fulfilled, (state, action) => {
                state.loading = false;
                const updatedLesson = {
                    ...action.payload,
                    id: action.payload._id
                };
                state.lessons = state.lessons.map(lesson =>
                    lesson.id === updatedLesson.id ? updatedLesson : lesson
                );
                if (state.selectedLesson && state.selectedLesson.id === updatedLesson.id) {
                    state.selectedLesson = updatedLesson;
                }
            })
            .addCase(updateLesson.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteLesson.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteLesson.fulfilled, (state, action) => {
                state.loading = false;
                state.lessons = state.lessons.filter(lesson => lesson.id !== action.payload);
            })
            .addCase(deleteLesson.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchLessonDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLessonDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedLesson = {
                    ...action.payload,
                    id: action.payload._id
                };
            })
            .addCase(fetchLessonDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});
export const {
    clearError,
    clearSelectedLesson,
    setSelectedLesson,
    clearLessons
} = lessonSlice.actions;
export default lessonSlice.reducer;
