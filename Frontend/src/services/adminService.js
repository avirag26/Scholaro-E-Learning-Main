const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get admin auth token
const getAdminAuthToken = () => {
    // Try to get from Redux store first, fallback to localStorage
    const state = window.__REDUX_STORE__?.getState?.();
    return state?.auth?.adminToken || localStorage.getItem('adminAuthToken');
};

// Helper function to create headers
const createHeaders = (includeAuth = true) => {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
        const token = getAdminAuthToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }
    
    return headers;
};

// Admin Service Functions
export const adminService = {
    // Get dashboard stats
    async getDashboardStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/stats`, {
                method: 'GET',
                headers: createHeaders(),
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (data.expired || data.message?.includes('expired')) {
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminInfo');
                    window.location.href = '/admin/login';
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Failed to fetch dashboard stats');
            }

            return data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    },

    // Get all users
    async getAllUsers(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.search) queryParams.append('search', params.search);
            if (params.status) queryParams.append('status', params.status);

            const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
                method: 'GET',
                headers: createHeaders(),
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (data.expired || data.message?.includes('expired')) {
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminInfo');
                    window.location.href = '/admin/login';
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Failed to fetch users');
            }

            return data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Get all tutors
    async getAllTutors(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.search) queryParams.append('search', params.search);
            if (params.status) queryParams.append('status', params.status);

            const response = await fetch(`${API_BASE_URL}/admin/tutors?${queryParams}`, {
                method: 'GET',
                headers: createHeaders(),
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (data.expired || data.message?.includes('expired')) {
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminInfo');
                    window.location.href = '/admin/login';
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Failed to fetch tutors');
            }

            return data;
        } catch (error) {
            console.error('Error fetching tutors:', error);
            throw error;
        }
    },

    // Toggle user block status
    async toggleUserBlock(userId) {
        try {
            console.log('=== ADMIN SERVICE TOGGLE USER BLOCK ===');
            console.log('User ID:', userId);
            console.log('API URL:', `${API_BASE_URL}/admin/users/${userId}/toggle-block`);
            
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-block`, {
                method: 'PATCH',
                headers: createHeaders(),
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) {
                if (data.expired || data.message?.includes('expired')) {
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminInfo');
                    window.location.href = '/admin/login';
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Failed to toggle user block status');
            }

            return data;
        } catch (error) {
            console.error('Error toggling user block:', error);
            throw error;
        }
    },

    // Toggle tutor block status
    async toggleTutorBlock(tutorId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tutors/${tutorId}/toggle-block`, {
                method: 'PATCH',
                headers: createHeaders(),
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (data.expired || data.message?.includes('expired')) {
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminInfo');
                    window.location.href = '/admin/login';
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Failed to toggle tutor block status');
            }

            return data;
        } catch (error) {
            console.error('Error toggling tutor block:', error);
            throw error;
        }
    },

    // Delete user
    async deleteUser(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: createHeaders(),
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (data.expired || data.message?.includes('expired')) {
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminInfo');
                    window.location.href = '/admin/login';
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Failed to delete user');
            }

            return data;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Delete tutor
    async deleteTutor(tutorId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tutors/${tutorId}`, {
                method: 'DELETE',
                headers: createHeaders(),
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (data.expired || data.message?.includes('expired')) {
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminInfo');
                    window.location.href = '/admin/login';
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Failed to delete tutor');
            }

            return data;
        } catch (error) {
            console.error('Error deleting tutor:', error);
            throw error;
        }
    },

    // Migrate existing users to add is_blocked field
    async migrateUserBlocks() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/migrate-blocks`, {
                method: 'POST',
                headers: createHeaders(),
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (data.expired || data.message?.includes('expired')) {
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminInfo');
                    window.location.href = '/admin/login';
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.message || 'Failed to migrate user blocks');
            }

            return data;
        } catch (error) {
            console.error('Error migrating user blocks:', error);
            throw error;
        }
    }
};

export default adminService;