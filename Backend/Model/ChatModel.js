import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'participants.userType'
      },
      userType: {
        type: String,
        required: true,
        enum: ['User', 'Tutor']
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'courses',
    required: true
  },
  lastMessage: {
    content: {
      type: String,
      default: ''
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'lastMessage.senderType'
    },
    senderType: {
      type: String,
      enum: ['User', 'Tutor']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  unreadCount: {
    user: {
      type: Number,
      default: 0
    },
    tutor: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  clearedBy: {
    user: {
      clearedAt: {
        type: Date,
        default: null
      }
    },
    tutor: {
      clearedAt: {
        type: Date,
        default: null
      }
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ course: 1 });
chatSchema.index({ 'participants.user': 1, course: 1 });
chatSchema.index({ updatedAt: -1 });

// Virtual for getting the other participant
chatSchema.virtual('otherParticipant').get(function() {
  return this.participants.find(p => p.user.toString() !== this.currentUserId?.toString());
});

// Method to get participant by type
chatSchema.methods.getParticipantByType = function(userType) {
  return this.participants.find(p => p.userType === userType);
};

// Method to get the other participant
chatSchema.methods.getOtherParticipant = function(currentUserId) {
  const currentUserIdStr = currentUserId.toString();
  return this.participants.find(p => p.user.toString() !== currentUserIdStr);
};

// Method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  const userIdStr = userId.toString();
  return this.participants.some(p => p.user.toString() === userIdStr);
};

// Method to update last message
chatSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = {
    content: message.content,
    sender: message.sender,
    senderType: message.senderType,
    timestamp: message.createdAt
  };
  return this.save();
};

// Method to increment unread count
chatSchema.methods.incrementUnreadCount = function(userType) {
  if (userType === 'User') {
    this.unreadCount.user += 1;
  } else if (userType === 'Tutor') {
    this.unreadCount.tutor += 1;
  }
  return this.save();
};

// Method to reset unread count
chatSchema.methods.resetUnreadCount = function(userType) {
  if (userType === 'User') {
    this.unreadCount.user = 0;
  } else if (userType === 'Tutor') {
    this.unreadCount.tutor = 0;
  }
  return this.save();
};

// Method to clear chat for specific user
chatSchema.methods.clearForUser = function(userType) {
  if (userType === 'User') {
    this.clearedBy.user.clearedAt = new Date();
  } else if (userType === 'Tutor') {
    this.clearedBy.tutor.clearedAt = new Date();
  }
  return this.save();
};

// Static method to find chat between user and tutor
chatSchema.statics.findChatBetween = function(userId, tutorId) {
  return this.findOne({
    'participants.user': { $all: [userId, tutorId] }
  });
};

// Static method to get user's chats
chatSchema.statics.getUserChats = function(userId, userType) {
  return this.find({
    participants: {
      $elemMatch: {
        user: userId,
        userType: userType
      }
    },
    isActive: true
  })
  .populate('course', 'title course_thumbnail')
  .sort({ updatedAt: -1 });
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;