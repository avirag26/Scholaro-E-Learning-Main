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
    this.isInitializing = false;

    SocketService.instance = this;
  }

  initialize(store) {

    if (this.isInitializing) {
      return;
    }


    if (this.socket && (this.socket.connected || this.socket.connecting)) {
      return;
    }


    if (this.socket && !this.socket.connected) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.isInitializing = true;
    this.store = store;

    const state = store.getState();
    const token = state.currentUser.accessToken || state.currentTutor.accessToken;

    if (!token) {
      this.isInitializing = false;
      return;
    }

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
      forceNew: false
    });

    this.setupEventListeners();
    this.isInitializing = false;
  }


  setupEventListeners() {
    if (!this.socket || !this.store) return;


    this.socket.on('connect', () => {
      this.store.dispatch(setConnected(true));
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      this.store.dispatch(setConnected(false));

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.store.dispatch(setConnected(false));
      this.isInitializing = false; // Reset flag on error

      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.store.dispatch(setReconnecting(true));
      } else {
        this.store.dispatch(setReconnecting(false));
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.store.dispatch(setConnected(true));
      this.store.dispatch(setReconnecting(false));
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      this.store.dispatch(setReconnecting(false));
    });

    // Notification events
    this.socket.on('new_notification', (notification) => {
      // Show toast notification
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.info(notification.body, {
          position: "top-right",
          autoClose: 5000,
        });
      }
      
      // Update notification count
      if (typeof window !== 'undefined' && window.updateNotificationCount) {
        window.updateNotificationCount();
      }
    });

    // Chat events
    this.socket.on('message_received', (message) => {
      this.store.dispatch(addMessage(message));
    });

    this.socket.on('messages_read', (data) => {
      this.store.dispatch(updateMessageReadStatus(data));
    });

    this.socket.on('chat_cleared', (data) => {
      this.store.dispatch(clearChatMessages(data.chatId));
    });

    this.socket.on('chat_cleared_for_user', (data) => {
      this.store.dispatch(clearChatMessages(data.chatId));
    });

    // User presence events
    this.socket.on('online_users_list', (onlineUsers) => {
      // Set the initial list of online users
      this.store.dispatch(setOnlineUsers(onlineUsers));
    });

    this.socket.on('user_online', (user) => {
      this.store.dispatch(addOnlineUser({
        userId: user.userId,
        userType: user.userType,
        user: user.user
      }));
    });

    this.socket.on('user_offline', (user) => {
      this.store.dispatch(removeOnlineUser({
        userId: user.userId,
        userType: user.userType,
        user: user.user
      }));
    });

    // Typing indicators
    this.socket.on('typing_indicator', (data) => {
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
      // Chat joined successfully
    });

    this.socket.on('user_joined_chat', (data) => {
      // User joined chat
    });

    this.socket.on('user_left_chat', (data) => {
      // User left chat
    });

    // Error handling
    this.socket.on('error', (error) => {
      // Handle socket errors
    });
  }

  // Join a chat room
  joinChat(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_chat', { chatId });
    }
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_chat', { chatId });
    }
  }

  // Send a message
  sendMessage(chatId, content, messageType = 'text') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', {
        chatId,
        content,
        messageType
      });
    } else {
      throw new Error('Not connected to chat server');
    }
  }

  // Send an image message with Cloudinary URL
  sendImageMessage(chatId, { imageUrl, caption, fileName }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', {
        chatId,
        content: caption || 'Image',
        messageType: 'image',
        fileUrl: imageUrl,
        fileName: fileName
      });
    } else {
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