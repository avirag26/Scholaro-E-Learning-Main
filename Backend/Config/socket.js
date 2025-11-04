import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../Model/usermodel.js';
import Tutor from '../Model/TutorModel.js';

// Store active connections
const activeConnections = new Map();

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    let userType;


    user = await User.findById(decoded.id).select('full_name email profileImage');
    if (user) {
      userType = 'user';
    } else {
      // If not found as user, try as tutor
      user = await Tutor.findById(decoded.id).select('full_name email profileImage');
      if (user) {
        userType = 'tutor';
      } else {
        return next(new Error('User not found'));
      }
    }


    socket.userId = decoded.id;
    socket.userType = userType;
    socket.user = user;

    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};

// Initialize Socket.IO server
export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {


    // Specific tutor connection logging
    if (socket.userType === 'tutor') {
      console.log(` TUTOR CONNECTED: ${socket.user.full_name} - ID: ${socket.userId}`);
    }
    if(socket.userType === 'user'){
       console.log(` TUTOR CONNECTED: ${socket.user.full_name} - ID: ${socket.userId}`);
    }

    // Store connection
    const userKey = `${socket.userType}_${socket.userId}`;
    if (!activeConnections.has(userKey)) {
      activeConnections.set(userKey, new Set());
    }
    activeConnections.get(userKey).add(socket.id);

    // Join user to their personal room for multi-device support
    socket.join(userKey);

    // Send current online users to the newly connected user
    const currentOnlineUsers = Array.from(activeConnections.keys()).map(userKey => {
      const [userType, userId] = userKey.split('_');
      return {
        userId,
        userType,
        // We don't have user details stored, but the client will handle this
      };
    });

    socket.emit('online_users_list', currentOnlineUsers);

    // Notify others that user is online
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      userType: socket.userType,
      user: socket.user
    });

    // Handle joining chat rooms
    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;

        if (!chatId) {
          socket.emit('error', { message: 'Chat ID is required' });
          return;
        }

        // Verify user has access to this chat
        const Chat = (await import('../Model/ChatModel.js')).default;
        const chat = await Chat.findById(chatId);

        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        if (!chat.isParticipant(socket.userId)) {
          socket.emit('error', { message: 'Unauthorized access to chat' });
          return;
        }

        // Join the chat room
        socket.join(`chat_${chatId}`);

        // Notify other participants that user joined
        socket.to(`chat_${chatId}`).emit('user_joined_chat', {
          userId: socket.userId,
          userType: socket.userType,
          user: socket.user,
          chatId
        });

        socket.emit('chat_joined', { chatId });

      } catch (error) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle leaving chat rooms
    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      if (chatId) {
        socket.leave(`chat_${chatId}`);
        socket.to(`chat_${chatId}`).emit('user_left_chat', {
          userId: socket.userId,
          userType: socket.userType,
          chatId
        });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, messageType = 'text', fileUrl, fileName } = data;

        if (!chatId || !content?.trim()) {
          socket.emit('error', { message: 'Chat ID and message content are required' });
          return;
        }

        // Verify user has access to this chat
        const Chat = (await import('../Model/ChatModel.js')).default;
        const Message = (await import('../Model/MessageModel.js')).default;

        const chat = await Chat.findById(chatId);

        if (!chat || !chat.isParticipant(socket.userId)) {
          socket.emit('error', { message: 'Unauthorized access to chat' });
          return;
        }

        // Create new message
        const messageData = {
          chat: chatId,
          sender: socket.userId,
          senderType: socket.userType === 'user' ? 'User' : 'Tutor',
          content: content.trim(),
          messageType
        };

        // Add file information for image messages
        if (messageType === 'image' && fileUrl) {
          messageData.fileUrl = fileUrl;
          messageData.fileName = fileName || 'Image';
        }

        const message = new Message(messageData);

        await message.save();
        await message.populate('sender', 'full_name profileImage');

        // Update chat's last message and unread counts
        await chat.updateLastMessage(message);

        // Increment unread count for other participant
        const otherParticipant = chat.getOtherParticipant(socket.userId);
        if (otherParticipant) {
          await chat.incrementUnreadCount(otherParticipant.userType);
        }

        // Broadcast message to all participants in the chat
        const messageResponse = {
          _id: message._id,
          chat: chatId,
          sender: message.sender,
          senderType: message.senderType,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
          readBy: message.readBy
        };

        // Add file information for image messages
        if (messageType === 'image') {
          messageResponse.fileUrl = message.fileUrl;
          messageResponse.fileName = message.fileName;
        }

        io.to(`chat_${chatId}`).emit('message_received', messageResponse);

        // Send notification to offline users (if any)
        // This would integrate with a push notification service

      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { chatId } = data;
      if (chatId) {
        socket.to(`chat_${chatId}`).emit('typing_indicator', {
          userId: socket.userId,
          userType: socket.userType,
          user: socket.user,
          isTyping: true,
          chatId
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      if (chatId) {
        socket.to(`chat_${chatId}`).emit('typing_indicator', {
          userId: socket.userId,
          userType: socket.userType,
          user: socket.user,
          isTyping: false,
          chatId
        });
      }
    });

    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { chatId } = data;

        if (!chatId) {
          socket.emit('error', { message: 'Chat ID is required' });
          return;
        }

        const Chat = (await import('../Model/ChatModel.js')).default;
        const Message = (await import('../Model/MessageModel.js')).default;

        const chat = await Chat.findById(chatId);

        if (!chat || !chat.isParticipant(socket.userId)) {
          socket.emit('error', { message: 'Unauthorized access to chat' });
          return;
        }

        // Mark all unread messages as read
        await Message.markAllAsRead(
          chatId,
          socket.userId,
          socket.userType === 'user' ? 'User' : 'Tutor'
        );

        // Reset unread count for this user
        await chat.resetUnreadCount(socket.userType === 'user' ? 'User' : 'Tutor');

        // Notify other participants about read status
        socket.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          readBy: socket.userId,
          userType: socket.userType,
          readAt: new Date()
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`${socket.userType.toUpperCase()} disconnected: ${socket.user.full_name} (${socket.userId})`);

      // Specific tutor disconnection logging
      if (socket.userType === 'tutor') {
        console.log(`🎓 TUTOR DISCONNECTED: ${socket.user.full_name} - ID: ${socket.userId}`);
      }

      // Remove connection
      const userKey = `${socket.userType}_${socket.userId}`;
      if (activeConnections.has(userKey)) {
        activeConnections.get(userKey).delete(socket.id);

        // If no more connections for this user, mark as offline
        if (activeConnections.get(userKey).size === 0) {
          activeConnections.delete(userKey);

          // Notify others that user is offline
          socket.broadcast.emit('user_offline', {
            userId: socket.userId,
            userType: socket.userType,
            user: socket.user
          });
        }
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      socket.emit('error', { message: 'Connection error occurred' });
    });
  });

  return io;
};

// Helper function to get online users
export const getOnlineUsers = () => {
  return Array.from(activeConnections.keys());
};

// Helper function to check if user is online
export const isUserOnline = (userType, userId) => {
  return activeConnections.has(`${userType}_${userId}`);
};

// Helper function to emit to specific user across all their devices
export const emitToUser = (io, userType, userId, event, data) => {
  const userKey = `${userType}_${userId}`;
  io.to(userKey).emit(event, data);
};