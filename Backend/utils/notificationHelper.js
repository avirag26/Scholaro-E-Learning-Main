import User from '../Model/usermodel.js';
import Tutor from '../Model/TutorModel.js';
import Admin from '../Model/AdminModel.js';

// Simple notification helper functions
export const createNotification = async (recipientType, recipientId, title, body) => {
  try {
    if (!title || !body) {
      return false;
    }

    let notification;
    
    if (recipientType === 'user') {
      notification = {
        message: `${title} ${body}`,
        read: false,
        timestamp: new Date()
      };
    } else {
      notification = {
        title: title || 'Notification',
        body: body || 'No message',
        read: false,
        createdAt: new Date()
      };
    }

    let Model;
    switch (recipientType) {
      case 'user':
        Model = User;
        break;
      case 'tutor':
        Model = Tutor;
        break;
      case 'admin':
        Model = Admin;
        break;
      default:
        throw new Error('Invalid recipient type');
    }

    await Model.findByIdAndUpdate(
      recipientId,
      { $push: { notifications: notification } },
      { new: true }
    );

    return true;
  } catch (error) {
    return false;
  }
};

export const notifyAdminNewOrder = async (orderId, amount, userEmail) => {
  try {
    const admin = await Admin.findOne({ status: true });
    if (admin) {
      await createNotification(
        'admin',
        admin._id,
        '🛒 New Order Received',
        `New order #${orderId} for $${amount} from ${userEmail}`
      );
    }
  } catch (error) {
    // Silent fail
  }
};

export const notifyTutorWalletCredit = async (tutorId, amount, reason) => {
  try {
    await createNotification(
      'tutor',
      tutorId,
      '💰 Wallet Credited',
      `Your wallet has been credited with $${amount}. Reason: ${reason}`
    );
  } catch (error) {
    // Silent fail
  }
};

export const notifyUsersNewLesson = async (courseId, lessonTitle) => {
  try {
    const enrolledUsers = await User.find({
      'courses.course': courseId
    });

    for (const user of enrolledUsers) {
      await createNotification(
        'user',
        user._id,
        '📚 New Lesson Available',
        `New lesson "${lessonTitle}" has been added to your course!`
      );
    }
  } catch (error) {
    // Silent fail
  }
};

// Get notifications for a user/tutor/admin
export const getNotifications = async (recipientType, recipientId, limit = 10) => {
  try {
    let Model;
    switch (recipientType) {
      case 'user':
        Model = User;
        break;
      case 'tutor':
        Model = Tutor;
        break;
      case 'admin':
        Model = Admin;
        break;
      default:
        throw new Error('Invalid recipient type');
    }

    const result = await Model.findById(recipientId)
      .select('notifications')
      .slice('notifications', -limit);

    return result?.notifications?.reverse() || [];
  } catch (error) {
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (recipientType, recipientId, notificationId) => {
  try {
    let Model;
    switch (recipientType) {
      case 'user':
        Model = User;
        break;
      case 'tutor':
        Model = Tutor;
        break;
      case 'admin':
        Model = Admin;
        break;
      default:
        throw new Error('Invalid recipient type');
    }

    await Model.updateOne(
      { _id: recipientId, 'notifications._id': notificationId },
      { $set: { 'notifications.$.read': true } }
    );

    return true;
  } catch (error) {
    return false;
  }
};