import { getNotifications, markNotificationAsRead } from '../../utils/notificationHelper.js';
import { STATUS_CODES } from '../../constants/constants.js';

// Get notifications for current user/tutor/admin
export const getUserNotifications = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    let recipientType, recipientId;

    if (req.user) {
      recipientType = 'user';
      recipientId = req.user._id;
    } else if (req.tutor) {
      recipientType = 'tutor';
      recipientId = req.tutor._id;
    } else if (req.admin) {
      recipientType = 'admin';
      recipientId = req.admin._id;
    } else {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const notifications = await getNotifications(recipientType, recipientId, parseInt(limit));

    res.status(STATUS_CODES.OK).json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    let recipientType, recipientId;

    // Determine user type based on middleware
    if (req.user) {
      recipientType = 'user';
      recipientId = req.user._id;
    } else if (req.tutor) {
      recipientType = 'tutor';
      recipientId = req.tutor._id;
    } else if (req.admin) {
      recipientType = 'admin';
      recipientId = req.admin._id;
    } else {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const success = await markNotificationAsRead(recipientType, recipientId, notificationId);

    if (success) {
      res.status(STATUS_CODES.OK).json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    let recipientType, recipientId;

    // Determine user type based on middleware
    if (req.user) {
      recipientType = 'user';
      recipientId = req.user._id;
    } else if (req.tutor) {
      recipientType = 'tutor';
      recipientId = req.tutor._id;
    } else if (req.admin) {
      recipientType = 'admin';
      recipientId = req.admin._id;
    } else {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const notifications = await getNotifications(recipientType, recipientId, 100); // Get more to count unread
    const unreadCount = notifications.filter(n => !n.read).length;

    res.status(STATUS_CODES.OK).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
  try {
    let recipientType, recipientId;

    // Determine user type based on middleware
    if (req.user) {
      recipientType = 'user';
      recipientId = req.user._id;
    } else if (req.tutor) {
      recipientType = 'tutor';
      recipientId = req.tutor._id;
    } else if (req.admin) {
      recipientType = 'admin';
      recipientId = req.admin._id;
    } else {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    let Model;
    switch (recipientType) {
      case 'user':
        Model = (await import('../../Model/usermodel.js')).default;
        break;
      case 'tutor':
        Model = (await import('../../Model/TutorModel.js')).default;
        break;
      case 'admin':
        Model = (await import('../../Model/AdminModel.js')).default;
        break;
      default:
        throw new Error('Invalid recipient type');
    }

    await Model.findByIdAndUpdate(recipientId, {
      $set: { notifications: [] }
    });



    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'All notifications cleared successfully'
    });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error clearing notifications',
      error: error.message
    });
  }
};
