import { userAPI, tutorAPI, adminAPI } from './axiosConfig';

// Get notifications based on user type
export const getNotifications = async (userType = 'user', limit = 10) => {
  
    let api, apiPath;
    switch (userType) {
      case 'tutor':
        api = tutorAPI;
        apiPath = '/api/tutors/notifications';
        break;
      case 'admin':
        api = adminAPI;
        apiPath = '/api/admin/notifications'; 
        break;
      default:
        api = userAPI;
        apiPath = '/api/users/notifications';
    }

    const response = await api.get(`${apiPath}?limit=${limit}`);
    return response.data;
  } 


export const markNotificationAsRead = async (userType = 'user', notificationId) => {
 
    let api, apiPath;
    switch (userType) {
      case 'tutor':
        api = tutorAPI;
        apiPath = `/api/tutors/notifications/${notificationId}/read`;
        break;
      case 'admin':
        api = adminAPI;
        apiPath = `/api/admin/notifications/${notificationId}/read`; // Admin is singular
        break;
      default:
        api = userAPI;
        apiPath = `/api/users/notifications/${notificationId}/read`;
    }

    const response = await api.put(apiPath);
    return response.data;
  } 


export const getUnreadCount = async (userType = 'user') => {

    let api, apiPath;
    switch (userType) {
      case 'tutor':
        api = tutorAPI;
        apiPath = '/api/tutors/notifications/unread-count';
        break;
      case 'admin':
        api = adminAPI;
        apiPath = '/api/admin/notifications/unread-count'; 
        break;
      default:
        api = userAPI;
        apiPath = '/api/users/notifications/unread-count';
    }

    const response = await api.get(apiPath);
    return response.data;
  } 

export const clearAllNotifications = async (userType = 'user') => {

    let api, apiPath;
    switch (userType) {
      case 'tutor':
        api = tutorAPI;
        apiPath = '/api/tutors/notifications/clear-all';
        break;
      case 'admin':
        api = adminAPI;
        apiPath = '/api/admin/notifications/clear-all'; 
        break;
      default:
        api = userAPI;
        apiPath = '/api/users/notifications/clear-all';
    }

    const response = await api.delete(apiPath);
    return response.data;
  } 