import { adminAPI } from '../api/axiosConfig';

export const adminOrderService = {
  // Get all orders with filters and pagination
  async getAllOrders(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const response = await adminAPI.get(`/api/admin/orders?${queryParams}`);
      return response.data;
    } catch (error) {
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