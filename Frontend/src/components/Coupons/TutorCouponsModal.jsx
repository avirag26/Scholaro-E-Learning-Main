import React, { useState, useEffect } from 'react';
import { tutorAPI } from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import { Copy, Edit, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';

const TutorCouponsModal = ({ isOpen, onClose, onEdit, onDelete, onToggleStatus }) => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, expired, inactive

    useEffect(() => {
        if (isOpen) {
            fetchCoupons();
        }
    }, [isOpen]);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await tutorAPI.get('/api/tutors/coupons');
            setCoupons(response.data.coupons || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success(`Coupon code "${code}" copied to clipboard!`);
    };

    const formatDiscount = (coupon) => {
        if (coupon.discountType === 'percentage') {
            const maxText = coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : '';
            return `${coupon.discountValue}% OFF${maxText}`;
        } else {
            return `₹${coupon.discountValue} OFF`;
        }
    };

    const formatExpiryDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDaysUntilExpiry = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getCouponStatus = (coupon) => {
        if (!coupon.isActive) return 'inactive';
        const daysLeft = getDaysUntilExpiry(coupon.expiryDate);
        if (daysLeft < 0) return 'expired';
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return 'exhausted';
        return 'active';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'expired': return 'bg-red-100 text-red-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'exhausted': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'expired': return 'Expired';
            case 'inactive': return 'Inactive';
            case 'exhausted': return 'Exhausted';
            default: return 'Unknown';
        }
    };

    const filteredCoupons = coupons.filter(coupon => {
        const status = getCouponStatus(coupon);
        if (filter === 'all') return true;
        if (filter === 'active') return status === 'active';
        if (filter === 'expired') return status === 'expired';
        if (filter === 'inactive') return status === 'inactive';
        return true;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-gray-300 ring-1 ring-gray-200 max-w-5xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">My Coupons</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage and view all your coupon codes
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex space-x-1">
                        {[
                            { key: 'all', label: 'All Coupons' },
                            { key: 'active', label: 'Active' },
                            { key: 'expired', label: 'Expired' },
                            { key: 'inactive', label: 'Inactive' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === tab.key
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                    ) : filteredCoupons.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg">No coupons found</p>
                            <p className="text-gray-400 text-sm mt-2">
                                {filter === 'all' ? 'Create your first coupon to get started!' : `No ${filter} coupons available`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredCoupons.map(coupon => {
                                const status = getCouponStatus(coupon);
                                const daysLeft = getDaysUntilExpiry(coupon.expiryDate);
                                const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

                                return (
                                    <div
                                        key={coupon._id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <button
                                                        onClick={() => handleCopyCode(coupon.code)}
                                                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-mono font-medium hover:bg-blue-200 transition-colors flex items-center space-x-1"
                                                    >
                                                        <span>{coupon.code}</span>
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                                        {formatDiscount(coupon)}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                                                        {getStatusText(status)}
                                                    </span>
                                                    {isExpiringSoon && (
                                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                                            {daysLeft} days left
                                                        </span>
                                                    )}
                                                </div>

                                                <h5 className="font-medium text-gray-900 mb-1">{coupon.title}</h5>
                                                {coupon.description && (
                                                    <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
                                                )}

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                                                    <div>
                                                        <span className="font-medium">Used:</span> {coupon.usedCount}
                                                        {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                                                    </div>
                                                    {coupon.minPurchaseAmount > 0 && (
                                                        <div>
                                                            <span className="font-medium">Min:</span> ₹{coupon.minPurchaseAmount}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-medium">Expires:</span> {formatExpiryDate(coupon.expiryDate)}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Per User:</span> {coupon.usagePerUser} time{coupon.usagePerUser !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center space-x-2 ml-4">
                                                <button
                                                    onClick={() => {
                                                        onEdit(coupon);
                                                        onClose();
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit coupon"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        onToggleStatus(coupon._id);
                                                        fetchCoupons(); // Refresh after toggle
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${coupon.isActive
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    title={coupon.isActive ? 'Deactivate coupon' : 'Activate coupon'}
                                                >
                                                    {coupon.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>

                                                {coupon.usedCount === 0 && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this coupon?')) {
                                                                onDelete(coupon._id);
                                                                fetchCoupons(); // Refresh after delete
                                                            }
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete coupon"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            💡 Click on coupon codes to copy them. Share with your students!
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorCouponsModal;