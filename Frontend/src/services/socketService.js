import { io } from 'socket.io-client';
import { 
  setConnected, 
  setReconnecting,
  addMessage,
  updateMessageReadStatus,
  addOnlineUser,
  removeOnlineUser,
  setOnlineUsers,
  setTypingUser,
  clearChatMessages
} from '../Redux/chatSlice';

class SocketService {
  constructor() {
    // Singleton pattern - prevent multiple instances
    if (SocketService.instance) {
      return SocketService.instance;
    }
    
    this.socket = null;
    this.store = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isInitializing = false; // Flag to prevent concurrent initializations
    
    SocketService.instance = this;
  }

  // Initialize socket connection
  initialize(store) {
    // Prevent concurrent initializations
    if (this.isInitializing) {
      console.log('Socket initialization already in progress, skipping...');
      return;
    }

    // Prevent multiple initializations - check if socket exists and is connecting/connected
    if (this.socket && (this.socket.connected || this.socket.connecting)) {
      console.log('Socket already exists and is connected/connecting, skipping initialization');
      return;
    }

    // If socket exists but is disconnected, clean it up first
    if (this.socket && !this.socket.connected) {
      console.log('Cleaning up existing disconnected socket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.isInitializing = true;
    this.store = store;
    
    const state = store.getState();
    const token = state.currentUser.accessToken || state.currentTutor.accessToken;
    
    if (!token) {
      console.error('No authentication token available');
      this.isInitializing = false;
      return;
    }

    console.log('Creating new socket connection...');

    // Create socket connection
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false // Changed to false to reuse connections when possible
    });

    this.setupEventListeners();
    this.isInitializing = false;
  }

  // Set up all socket event listeners
  setupEventListeners() {
    if (!this.socket || !this.store) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.store.dispatch(setConnected(true));
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.store.dispatch(setConnected(false));
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      console.error('Error details:', error);
      this.store.dispatch(setConnected(false));
      this.isInitializing = false; // Reset flag on error
      
      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.store.dispatch(setReconnecting(true));
      } else {
        console.error('Max reconnection attempts reached');
        this.store.dispatch(setReconnecting(false));
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.store.dispatch(setConnected(true));
      this.store.dispatch(setReconnecting(false));
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      this.store.dispatch(setReconnecting(false));
    });

    // Chat events
    this.socket.on('message_received', (message) => {
      console.log('Message received:', message);
      this.store.dispatch(addMessage(message));
    });

    this.socket.on('messages_read', (data) => {
      console.log('Messages read:', data);
      this.store.dispatch(updateMessageReadStatus(data));
    });

    this.socket.on('chat_cleared', (data) => {
      console.log('Chat cleared:', data);
      this.store.dispatch(clearChatMessages(data.chatId));
    });

    this.socket.on('chat_cleared_for_user', (data) => {
      console.log('Chat cleared for current user:', data);
      this.store.dispatch(clearChatMessages(data.chatId));
    });

    // User presence events
    this.socket.on('online_users_list', (onlineUsers) => {
      console.log('Initial online users:', onlineUsers);
      // Set the initial list of online users
      this.store.dispatch(setOnlineUsers(onlineUsers));
    });

    this.socket.on('user_online', (user) => {
      console.log('User online:', user);
      this.store.dispatch(addOnlineUser({
        userId: user.userId,
        userType: user.userType,
        user: user.user
      }));
    });

    this.socket.on('user_offline', (user) => {
      console.log('User offline:', user);
      this.store.dispatch(removeOnlineUser({
        userId: user.userId,
        userType: user.userType,
        user: user.user
      }));
    });

    // Typing indicators
    this.socket.on('typing_indicator', (data) => {
      console.log('Typing indicator:', data);
      this.store.dispatch(setTypingUser({
        chatId: data.chatId,
        user: {
          userId: data.userId,
          userType: data.userType,
          name: data.user.full_name
        },
        isTyping: data.isTyping
      }));
    });

    // Chat room events
    this.socket.on('chat_joined', (data) => {
      console.log('Joined chat:', data.chatId);
    });

    this.socket.on('user_joined_chat', (data) => {
      console.log('User joined chat:', data);
    });

    this.socket.on('user_left_chat', (data) => {
      console.log('User left chat:', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      // You could dispatch an error action here if needed
    });
  }

  // Join a chat room
  joinChat(chatId) {
    if (this.socket && this.socket.connected) {
      console.log('Joining chat:', chatId);
      this.socket.emit('join_chat', { chatId });
    }
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (this.socket && this.socket.connected) {
      console.log('Leaving chat:', chatId);
      this.socket.emit('leave_chat', { chatId });
    }
  }

  // Send a message
  sendMessage(chatId, content, messageType = 'text') {
    if (this.socket && this.socket.connected) {
      console.log('Sending message:', { chatId, content, messageType });
      this.socket.emit('send_message', {
        chatId,
        content,
        messageType
      });
    } else {
      console.error('Socket not connected, cannot send message');
      throw new Error('Not connected to chat server');
    }
  }

  // Send an image message with Cloudinary URL
  sendImageMessage(chatId, { imageUrl, caption, fileName }) {
    if (this.socket && this.socket.connected) {
      console.log('Sending image message:', { chatId, imageUrl, caption, fileName });
      this.socket.emit('send_message', {
        chatId,
        content: caption || 'Image',
        messageType: 'image',
        fileUrl: imageUrl,
        fileName: fileName
      });
    } else {
      console.error('Socket not connected, cannot send image message');
      throw new Error('Not connected to chat server');
    }
  }

  // Start typing indicator
  startTyping(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_start', { chatId });
    }
  }

  // Stop typing indicator
  stopTyping(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_stop', { chatId });
    }
  }

  // Mark messages as read
  markAsRead(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark_read', { chatId });
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      
      if (this.store) {
        this.store.dispatch(setConnected(false));
      }
    }
  }

  // Get connection status
  isConnected() {
    return this.socket && (this.socket.connected || this.socket.connecting);
  }

  // Reconnect manually
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;