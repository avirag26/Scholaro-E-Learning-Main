import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI, tutorAPI } from '../api/axiosConfig';

// Get user's chats
export const getChats = createAsyncThunk(
  'chat/getChats',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      // Check if user is tutor or regular user
      const isTutor = state.currentTutor?.isAuthenticated;
      const api = isTutor ? tutorAPI : userAPI;
      const endpoint = isTutor ? '/api/tutors/chats' : '/api/users/chats';
      
      const response = await api.get(endpoint);
      return response.data.chats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
    }
  }
);

// Create or get chat
export const createOrGetChat = createAsyncThunk(
  'chat/createOrGetChat',
  async ({ tutorId }, { rejectWithValue }) => {
    try {
      const response = await userAPI.post('/api/users/chats', { tutorId });
      return response.data.chat;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create chat');
    }
  }
);

// Get chat messages
export const getChatMessages = createAsyncThunk(
  'chat/getChatMessages',
  async ({ chatId, page = 1 }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const isTutor = state.currentTutor?.isAuthenticated;
      const api = isTutor ? tutorAPI : userAPI;
      const endpoint = isTutor 
        ? `/api/tutors/chats/${chatId}/messages` 
        : `/api/users/chats/${chatId}/messages`;
      
      const response = await api.get(`${endpoint}?page=${page}&limit=50`);
      return {
        chatId,
        messages: response.data.messages,
        pagination: response.data.pagination,
        isFirstLoad: page === 1
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

// Mark chat as read
export const markChatAsRead = createAsyncThunk(
  'chat/markChatAsRead',
  async (chatId, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const isTutor = state.currentTutor?.isAuthenticated;
      const api = isTutor ? tutorAPI : userAPI;
      const endpoint = isTutor 
        ? `/api/tutors/chats/${chatId}/read` 
        : `/api/users/chats/${chatId}/read`;
      
      await api.put(endpoint);
      return chatId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

// Get available tutors (for users)
export const getAvailableTutors = createAsyncThunk(
  'chat/getAvailableTutors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.get('/api/users/available-tutors');
      return response.data.tutors;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tutors');
    }
  }
);

// Get tutor students (for tutors)
export const getTutorStudents = createAsyncThunk(
  'chat/getTutorStudents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorAPI.get('/api/tutors/students');
      return response.data.students;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch students');
    }
  }
);

// Clear chat messages
export const clearChat = createAsyncThunk(
  'chat/clearChat',
  async (chatId, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const isTutor = state.currentTutor?.isAuthenticated;
      const api = isTutor ? tutorAPI : userAPI;
      const endpoint = isTutor 
        ? `/api/tutors/chats/${chatId}/clear` 
        : `/api/users/chats/${chatId}/clear`;
      
      await api.delete(endpoint);
      return chatId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear chat');
    }
  }
);



const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    // Chat list
    chats: [],
    activeChat: null,
    
    // Messages by chat ID
    messages: {},
    messagePagination: {},
    
    // Socket connection status (no socket instance stored)
    connected: false,
    reconnecting: false,
    
    // Online users and typing indicators
    onlineUsers: [],
    typingUsers: {},
    
    // Available contacts
    availableTutors: [],
    tutorStudents: [],
    
    // UI state
    loading: false,
    messagesLoading: false,
    error: null,
    
    // Unread counts
    totalUnreadCount: 0
  },
  reducers: {
    // Socket connection management
    setConnected: (state, action) => {
      state.connected = action.payload;
      if (action.payload) {
        state.reconnecting = false;
      }
    },
    
    setReconnecting: (state, action) => {
      state.reconnecting = action.payload;
    },
    
    // Chat management
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
      
      // Reset unread count for active chat
      if (action.payload) {
        const chat = state.chats.find(c => c._id === action.payload);
        if (chat) {
          chat.unreadCount = 0;
        }
      }
    },
    
    // Real-time message handling
    addMessage: (state, action) => {
      const message = action.payload;
      const chatId = message.chat;
      
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      
      // Check if message already exists (prevent duplicates)
      const exists = state.messages[chatId].some(m => m._id === message._id);
      if (!exists) {
        state.messages[chatId].push(message);
      }
      
      // Update chat's last message
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) {
        chat.lastMessage = {
          content: message.content,
          sender: message.sender._id,
          senderType: message.senderType,
          timestamp: message.createdAt
        };
        chat.updatedAt = message.createdAt;
        
        // Increment unread count if not active chat
        if (state.activeChat !== chatId) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
      }
      
      // Update total unread count
      state.totalUnreadCount = state.chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
    },
    
    // Update message read status
    updateMessageReadStatus: (state, action) => {
      const { chatId, readBy, readAt } = action.payload;
      
      if (state.messages[chatId]) {
        state.messages[chatId].forEach(message => {
          if (!message.readBy) {
            message.readBy = [];
          }
          
          const existingRead = message.readBy.find(r => r.user === readBy);
          if (!existingRead) {
            message.readBy.push({
              user: readBy,
              readAt: readAt
            });
          }
        });
      }
    },
    
    // Online users management
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    
    addOnlineUser: (state, action) => {
      const user = action.payload;
      const userKey = `${user.userType}_${user.userId}`;
      
      if (!state.onlineUsers.find(u => `${u.userType}_${u.userId}` === userKey)) {
        state.onlineUsers.push(user);
      }
    },
    
    removeOnlineUser: (state, action) => {
      const user = action.payload;
      const userKey = `${user.userType}_${user.userId}`;
      
      state.onlineUsers = state.onlineUsers.filter(u => `${u.userType}_${u.userId}` !== userKey);
    },
    
    // Typing indicators
    setTypingUser: (state, action) => {
      const { chatId, user, isTyping } = action.payload;
      
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      
      if (isTyping) {
        const exists = state.typingUsers[chatId].find(u => u.userId === user.userId);
        if (!exists) {
          state.typingUsers[chatId].push(user);
        }
      } else {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(u => u.userId !== user.userId);
      }
    },
    
    clearTypingUsers: (state, action) => {
      const chatId = action.payload;
      if (state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
    },
    
    // Reset unread count
    resetUnreadCount: (state, action) => {
      const chatId = action.payload;
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) {
        chat.unreadCount = 0;
      }
      
      // Recalculate total unread count
      state.totalUnreadCount = state.chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear chat messages (for real-time updates)
    clearChatMessages: (state, action) => {
      const chatId = action.payload;
      // Clear messages for this chat
      state.messages[chatId] = [];
      // Update chat's last message
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) {
        chat.lastMessage = null;
        chat.unreadCount = 0;
      }
    },

    // Clear chat state (for logout)
    clearChatState: (state) => {
      state.chats = [];
      state.activeChat = null;
      state.messages = {};
      state.messagePagination = {};
      state.onlineUsers = [];
      state.typingUsers = {};
      state.availableTutors = [];
      state.tutorStudents = [];
      state.totalUnreadCount = 0;
      state.connected = false;
      state.reconnecting = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get chats
      .addCase(getChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
        
        // Calculate total unread count
        state.totalUnreadCount = action.payload.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
      })
      .addCase(getChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create or get chat
      .addCase(createOrGetChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrGetChat.fulfilled, (state, action) => {
        state.loading = false;
        const newChat = action.payload;
        
        // Add chat if it doesn't exist
        const existingChat = state.chats.find(c => c._id === newChat._id);
        if (!existingChat) {
          state.chats.unshift(newChat);
        }
        
        // Set as active chat
        state.activeChat = newChat._id;
      })
      .addCase(createOrGetChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get chat messages
      .addCase(getChatMessages.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(getChatMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { chatId, messages, pagination, isFirstLoad } = action.payload;
        
        if (isFirstLoad) {
          state.messages[chatId] = messages;
        } else {
          // Prepend older messages
          state.messages[chatId] = [...messages, ...(state.messages[chatId] || [])];
        }
        
        state.messagePagination[chatId] = pagination;
      })
      .addCase(getChatMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
      })
      
      // Mark chat as read
      .addCase(markChatAsRead.fulfilled, (state, action) => {
        const chatId = action.payload;
        const chat = state.chats.find(c => c._id === chatId);
        if (chat) {
          chat.unreadCount = 0;
        }
        
        // Recalculate total unread count
        state.totalUnreadCount = state.chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
      })
      
      // Get available tutors
      .addCase(getAvailableTutors.fulfilled, (state, action) => {
        state.availableTutors = action.payload;
      })
      
      // Get tutor students
      .addCase(getTutorStudents.fulfilled, (state, action) => {
        state.tutorStudents = action.payload;
      })
      
      // Clear chat
      .addCase(clearChat.fulfilled, (state, action) => {
        const chatId = action.payload;
        // Clear messages for this chat
        state.messages[chatId] = [];
        // Update chat's last message
        const chat = state.chats.find(c => c._id === chatId);
        if (chat) {
          chat.lastMessage = null;
          chat.unreadCount = 0;
        }
      })
      

  }
});

export const {
  setConnected,
  setReconnecting,
  setActiveChat,
  addMessage,
  updateMessageReadStatus,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setTypingUser,
  clearTypingUsers,
  resetUnreadCount,
  clearError,
  clearChatMessages,
  clearChatState
} = chatSlice.actions;

export default chatSlice.reducer;