import { adminAPI } from '../api/axiosConfig';

export const adminOrderService = {
  // Get all orders with filters and pagination
  async getAllOrders(params = {}) {
    try {
      console.log('Calling getAllOrders with params:', params);
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      console.log('Making request to:', `/api/admin/orders?${queryParams}`);
      const response = await adminAPI.get(`/api/admin/orders?${queryParams}`);
      console.log('Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getAllOrders:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Get order details by ID
  async getOrderDetails(orderId) {
    const response = await adminAPI.get(`/api/admin/orders/${orderId}`);
    return response.data;
  },

  // Update order status
  async updateOrderStatus(orderId, status) {
    const response = await adminAPI.patch(`/api/admin/orders/${orderId}/status`, {
      status
    });
    return response.data;
  },

  // Get order statistics
  async getOrderStats(period = '30') {
    const response = await adminAPI.get(`/api/admin/orders/stats?period=${period}`);
    return response.data;
  },





  // Export orders (future feature)
  async exportOrders(params = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await adminAPI.get(`/api/admin/orders/export?${queryParams}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};