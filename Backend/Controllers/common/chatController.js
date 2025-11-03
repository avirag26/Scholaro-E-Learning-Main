import Chat from '../../Model/ChatModel.js';
import Message from '../../Model/MessageModel.js';
import User from '../../Model/usermodel.js';
import Tutor from '../../Model/TutorModel.js';
import { Course } from '../../Model/CourseModel.js';
import mongoose from 'mongoose';

// Get user's chat list
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user?._id || req.tutor?._id;
    const userType = req.user ? 'User' : 'Tutor';

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const chats = await Chat.getUserChats(userId, userType);

    // Format chats for response
    const formattedChats = await Promise.all(chats.map(async (chat) => {
      // Get the other participant in the chat
      const otherParticipant = chat.getOtherParticipant(userId.toString());
      
      if (!otherParticipant) {
        return null; // Skip invalid chats
      }
      
      if (otherParticipant.user.toString() === userId.toString()) {
        return null; // Skip self-chats
      }
      

      
      let participantInfo = null;
      if (otherParticipant) {
        if (otherParticipant.userType === 'User') {
          participantInfo = await User.findById(otherParticipant.user)
            .select('full_name email profileImage');
        } else {
          participantInfo = await Tutor.findById(otherParticipant.user)
            .select('full_name email profileImage');
        }
      }

      // Get all courses user has with this participant
      let participantCourses = [];
      if (participantInfo && userType === 'User') {
        // For users, get all courses they have with this tutor
        const userWithCourses = await User.findById(userId).populate('courses.course');
        participantCourses = userWithCourses.courses
          .filter(enrollment => enrollment.course && enrollment.course.tutor.toString() === otherParticipant.user.toString())
          .map(enrollment => ({
            _id: enrollment.course._id,
            title: enrollment.course.title,
            thumbnail: enrollment.course.course_thumbnail
          }));
      } else if (participantInfo && userType === 'Tutor') {
        // For tutors, get courses the student is enrolled in
        const studentWithCourses = await User.findById(otherParticipant.user).populate('courses.course');
        participantCourses = studentWithCourses.courses
          .filter(enrollment => enrollment.course && enrollment.course.tutor.toString() === userId.toString())
          .map(enrollment => ({
            _id: enrollment.course._id,
            title: enrollment.course.title,
            thumbnail: enrollment.course.course_thumbnail
          }));
      }

      return {
        _id: chat._id,
        course: {
          _id: chat.course._id,
          title: chat.course.title,
          thumbnail: chat.course.course_thumbnail
        },
        participant: participantInfo ? {
          _id: participantInfo._id,
          name: participantInfo.full_name,
          email: participantInfo.email,
          profileImage: participantInfo.profileImage,
          type: otherParticipant.userType.toLowerCase(),
          courses: participantCourses
        } : null,
        lastMessage: chat.lastMessage,
        unreadCount: userType === 'User' ? chat.unreadCount.user : chat.unreadCount.tutor,
        updatedAt: chat.updatedAt
      };
    }));

    // Filter out null chats (invalid chats)
    const validChats = formattedChats.filter(chat => chat !== null);

    res.status(200).json({
      success: true,
      chats: validChats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chats',
      error: error.message
    });
  }
};

// Create or get existing chat
export const createOrGetChat = async (req, res) => {
  try {
    const { tutorId } = req.body;
    const userId = req.user._id;

    if (!tutorId) {
      return res.status(400).json({
        success: false,
        message: 'Tutor ID is required'
      });
    }

    // Prevent user from chatting with themselves
    if (tutorId === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself'
      });
    }

    // Verify tutor exists
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    // Check if user has purchased any course from this tutor
    const user = await User.findById(userId).populate('courses.course');
    const tutorCourses = user.courses.filter(enrollment => 
      enrollment.course && enrollment.course.tutor.toString() === tutorId
    );
    
    if (tutorCourses.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase a course from this tutor to start chatting'
      });
    }

    // Use the first course for the chat (since it's one chat per tutor now)
    const firstCourse = tutorCourses[0].course;

    // Check if chat already exists between user and tutor
    let chat = await Chat.findOne({
      'participants.user': { $all: [userId, tutorId] }
    });

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [
          {
            user: userId,
            userType: 'User'
          },
          {
            user: tutorId,
            userType: 'Tutor'
          }
        ],
        course: firstCourse._id
      });

      await chat.save();
    }

    // Populate chat details
    await chat.populate('course', 'title course_thumbnail');
    await chat.populate('participants.user', 'full_name email profileImage');

    // Format the response to match getUserChats format
    const otherParticipant = chat.getOtherParticipant(userId);
    let participantInfo = null;
    
    if (otherParticipant && otherParticipant.user) {
      participantInfo = {
        _id: otherParticipant.user._id,
        name: otherParticipant.user.full_name,
        email: otherParticipant.user.email,
        profileImage: otherParticipant.user.profileImage,
        type: otherParticipant.userType.toLowerCase(),
        courses: tutorCourses.map(enrollment => ({
          _id: enrollment.course._id,
          title: enrollment.course.title,
          thumbnail: enrollment.course.course_thumbnail
        }))
      };
    }

    res.status(200).json({
      success: true,
      chat: {
        _id: chat._id,
        course: {
          _id: chat.course._id,
          title: chat.course.title,
          thumbnail: chat.course.course_thumbnail
        },
        participant: participantInfo,
        lastMessage: chat.lastMessage,
        unreadCount: chat.unreadCount.user,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating chat',
      error: error.message
    });
  }
};

// Get chat messages with pagination
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user?._id || req.tutor?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID'
      });
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to chat'
      });
    }

    // Check if user has cleared this chat and get messages after that timestamp
    const userType = req.user ? 'User' : 'Tutor';
    const clearedTimestamp = userType === 'User' 
      ? chat.clearedBy?.user?.clearedAt 
      : chat.clearedBy?.tutor?.clearedAt;
    
    // Get messages with pagination, filtering by cleared timestamp if exists
    const messages = await Message.getChatMessages(
      chatId, 
      parseInt(page), 
      parseInt(limit), 
      clearedTimestamp
    );
    
    // Reverse to show oldest first
    const formattedMessages = messages.reverse().map(message => ({
      _id: message._id,
      sender: {
        _id: message.sender._id,
        name: message.sender.full_name,
        profileImage: message.sender.profileImage
      },
      senderType: message.senderType.toLowerCase(),
      content: message.content,
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      readBy: message.readBy,
      isRead: message.isReadByUser(userId),
      createdAt: message.createdAt,
      editedAt: message.editedAt
    }));

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({
      chat: chatId,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      messages: formattedMessages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / parseInt(limit)),
        totalMessages,
        hasNext: parseInt(page) < Math.ceil(totalMessages / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// Mark chat messages as read
export const markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?._id || req.tutor?._id;
    const userType = req.user ? 'User' : 'Tutor';

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID'
      });
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to chat'
      });
    }

    // Mark all unread messages as read
    await Message.markAllAsRead(chatId, userId, userType);

    // Reset unread count for this user
    await chat.resetUnreadCount(userType);

    // Emit socket event if available
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${chatId}`).emit('messages_read', {
        chatId,
        readBy: userId,
        userType: userType.toLowerCase(),
        readAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
};

// Get available tutors for user (from purchased courses)
export const getAvailableTutors = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user with enrolled courses
    const user = await User.findById(userId).populate({
      path: 'courses.course',
      select: 'title course_thumbnail tutor',
      populate: {
        path: 'tutor',
        select: 'full_name email profileImage bio'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Extract unique tutors from enrolled courses
    const tutorMap = new Map();
    const tutorCourses = new Map();
    


    user.courses.forEach(enrollment => {
      if (enrollment.course && enrollment.course.tutor) {
        const tutor = enrollment.course.tutor;
        const tutorId = tutor._id.toString();
        
        // Don't include the user themselves (safety check)
        // This prevents users from seeing themselves if they're also tutors
        if (tutorId === userId.toString()) {
          return;
        }
        
        if (!tutorMap.has(tutorId)) {
          tutorMap.set(tutorId, {
            _id: tutor._id,
            name: tutor.full_name,
            email: tutor.email,
            profileImage: tutor.profileImage,
            bio: tutor.bio,
            courses: []
          });
          tutorCourses.set(tutorId, []);
        }
        
        tutorCourses.get(tutorId).push({
          _id: enrollment.course._id,
          title: enrollment.course.title,
          thumbnail: enrollment.course.course_thumbnail
        });
      }
    });

    // Add courses to tutors
    tutorMap.forEach((tutor, tutorId) => {
      tutor.courses = tutorCourses.get(tutorId);
    });

    const availableTutors = Array.from(tutorMap.values());
    


    res.status(200).json({
      success: true,
      tutors: availableTutors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available tutors',
      error: error.message
    });
  }
};

// Get students for tutor (from tutor's courses)
export const getTutorStudents = async (req, res) => {
  try {
    const tutorId = req.tutor._id;

    // Get tutor's courses
    const courses = await Course.find({ tutor: tutorId })
      .select('title course_thumbnail');

    if (!courses.length) {
      return res.status(200).json({
        success: true,
        students: []
      });
    }

    const courseIds = courses.map(course => course._id);

    // Get users enrolled in tutor's courses
    const enrolledUsers = await User.find({
      'courses.course': { $in: courseIds }
    }).select('full_name email profileImage courses');

    // Format students with their enrolled courses
    const studentMap = new Map();

    enrolledUsers.forEach(user => {
      const studentId = user._id.toString();
      
      // Don't include the tutor themselves (safety check)
      if (studentId === tutorId.toString()) {
        return;
      }
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          _id: user._id,
          name: user.full_name,
          email: user.email,
          profileImage: user.profileImage,
          courses: []
        });
      }

      // Add courses this student is enrolled in
      user.courses.forEach(enrollment => {
        if (courseIds.some(id => id.toString() === enrollment.course.toString())) {
          const course = courses.find(c => c._id.toString() === enrollment.course.toString());
          if (course) {
            studentMap.get(studentId).courses.push({
              _id: course._id,
              title: course.title,
              thumbnail: course.course_thumbnail
            });
          }
        }
      });
    });

    const students = Array.from(studentMap.values());

    res.status(200).json({
      success: true,
      students
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};
//

export const clearChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?._id || req.tutor?._id;
    const userType = req.user ? 'User' : 'Tutor';

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.isParticipant(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to chat'
      });
    }

    // Mark chat as cleared for this user only (like WhatsApp)
    await chat.clearForUser(userType);

    // Reset unread count for this user only
    await chat.resetUnreadCount(userType);

    // Emit socket event to notify only this user (not other participants)
    const io = req.app.get('io');
    if (io) {
      // Emit only to the user who cleared the chat
      const userKey = `${userType.toLowerCase()}_${userId}`;
      io.to(userKey).emit('chat_cleared_for_user', {
        chatId,
        clearedBy: userId,
        userType: userType.toLowerCase(),
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat cleared successfully for you'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing chat',
      error: error.message
    });
  }
};

