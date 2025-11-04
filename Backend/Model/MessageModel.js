import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType'
  },
  senderType: {
    type: String,
    required: true,
    enum: ['User', 'Tutor']
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  readBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'readBy.userType'
      },
      userType: {
        type: String,
        enum: ['User', 'Tutor']
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ chat: 1, isDeleted: 1, createdAt: -1 });

// Virtual for checking if message is read by specific user
messageSchema.virtual('isReadBy').get(function() {
  return (userId) => {
    return this.readBy.some(read => read.user.toString() === userId.toString());
  };
});

// Method to mark message as read by user
messageSchema.methods.markAsRead = function(userId, userType) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      userType: userType,
      readAt: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to check if message is read by user
messageSchema.methods.isReadByUser = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Method to edit message content
messageSchema.methods.editContent = function(newContent) {
  this.content = newContent;
  this.editedAt = new Date();
  return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = 'This message was deleted';
  return this.save();
};

// Static method to get chat messages with pagination
messageSchema.statics.getChatMessages = function(chatId, page = 1, limit = 50, afterTimestamp = null) {
  const skip = (page - 1) * limit;
  
  const query = {
    chat: chatId,
    isDeleted: false
  };
  
  // If afterTimestamp is provided, only get messages after that time
  if (afterTimestamp) {
    query.createdAt = { $gt: afterTimestamp };
  }
  
  return this.find(query)
  .populate('sender', 'full_name profileImage')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get unread messages count
messageSchema.statics.getUnreadCount = function(chatId, userId) {
  return this.countDocuments({
    chat: chatId,
    sender: { $ne: userId },
    isDeleted: false,
    'readBy.user': { $ne: userId }
  });
};

// Static method to mark all messages as read
messageSchema.statics.markAllAsRead = function(chatId, userId, userType) {
  return this.updateMany(
    {
      chat: chatId,
      sender: { $ne: userId },
      isDeleted: false,
      'readBy.user': { $ne: userId }
    },
    {
      $push: {
        readBy: {
          user: userId,
          userType: userType,
          readAt: new Date()
        }
      }
    }
  );
};

// Pre-save middleware to validate content
messageSchema.pre('save', function(next) {
  if (this.messageType === 'text' && (!this.content || this.content.trim().length === 0)) {
    return next(new Error('Text message content cannot be empty'));
  }
  
  if (this.messageType !== 'text' && !this.fileUrl) {
    return next(new Error('File message must have a file URL'));
  }
  
  next();
});

// Post-save middleware to update chat's last message
messageSchema.post('save', async function(doc) {
  try {
    const Chat = mongoose.model('Chat');
    const chat = await Chat.findById(doc.chat);
    
    if (chat) {
      await chat.updateLastMessage(doc);
    }
  } catch (error) {
  }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;