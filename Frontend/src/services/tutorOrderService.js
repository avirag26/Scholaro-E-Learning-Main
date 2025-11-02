import { tutorAPI } from '../api/axiosConfig';

export const tutorOrderService = {
  // Get all orders for tutor's courses
  async getAllOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const response = await tutorAPI.get(`/api/tutors/orders?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get order details by ID
  async getOrderDetails(orderId) {
    const response = await tutorAPI.get(`/api/tutors/orders/${orderId}`);
    return response.data;
  },

  // Get order statistics
  async getOrderStats(period = '30') {
    const response = await tutorAPI.get(`/api/tutors/orders/stats?period=${period}`);
    return response.data;
  },


};