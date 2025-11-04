import { useState, useEffect } from 'react';
import { Bell, Package, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api/axiosConfig';

export default function AdminNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchRecentOrders();
        // Poll for new orders every 30 seconds
        const interval = setInterval(fetchRecentOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchRecentOrders = async () => {
        try {
            const response = await adminAPI.get('/api/admin/orders?limit=5&sortBy=newest');
            if (response.data.success) {
                const recentOrders = response.data.orders.map(order => ({
                    id: order._id,
                    orderId: order.orderId,
                    customerName: order.user?.name || 'Unknown Customer',
                    amount: order.finalAmount,
                    status: order.status,
                    createdAt: order.createdAt,
                    type: 'order'
                }));

                setNotifications(recentOrders);
                // Count orders from last 24 hours as "unread"
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const recentCount = recentOrders.filter(order =>
                    new Date(order.createdAt) > yesterday
                ).length;
                setUnreadCount(recentCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (notification.type === 'order') {
            navigate(`/admin/orders/${notification.orderId}`);
            setShowDropdown(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'text-green-600';
            case 'pending':
                return 'text-yellow-600';
            case 'processing':
                return 'text-blue-600';
            case 'cancelled':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-sky-500 focus:outline-none"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                <button
                                    onClick={() => setShowDropdown(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    No recent notifications
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <Package className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        New Order #{notification.orderId}
                                                    </p>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {notification.customerName} • ₹{notification.amount?.toLocaleString()}
                                                </p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className={`text-xs font-medium ${getStatusColor(notification.status)}`}>
                                                        {notification.status === 'paid' ? 'Completed' : notification.status}
                                                    </span>
                                                    <Eye className="w-3 h-3 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        navigate('/admin/orders');
                                        setShowDropdown(false);
                                    }}
                                    className="w-full text-center text-sm text-sky-600 hover:text-sky-700 font-medium"
                                >
                                    View All Orders
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}