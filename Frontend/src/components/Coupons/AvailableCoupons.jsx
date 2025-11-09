import React, { useState, useEffect } from 'react';
import { userAPI } from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const AvailableCoupons = ({ isOpen, onClose, onCouponSelect, selectedTutorId = null }) => {
    const [coupons, setCoupons] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedTutors, setExpandedTutors] = useState({});

    useEffect(() => {
        fetchPublicCoupons();
    }, []);

    const fetchPublicCoupons = async () => {
        try {
            setLoading(true);
            const response = await userAPI.get('/api/users/coupons/public');
            setCoupons(response.data.couponsByTutor || {});
        } catch (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Failed to load available coupons');
        } finally {
            setLoading(false);
        }
    };

    const toggleTutorExpansion = (tutorId) => {
        setExpandedTutors(prev => ({
            ...prev,
            [tutorId]: !prev[tutorId]
        }));
    };

    const handleCouponSelect = (code) => {
        if (onCouponSelect) {
            onCouponSelect(code);
        }
        onClose();
        toast.success(`Coupon code "${code}" selected!`);
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

    if (!isOpen) return null;

    const tutorIds = Object.keys(coupons);
    const filteredTutorIds = selectedTutorId
        ? tutorIds.filter(id => id === selectedTutorId)
        : tutorIds;

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-gray-300 ring-1 ring-gray-200 max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Available Coupons</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {filteredTutorIds.length === 0 ? 'No coupons available' :
                                `${filteredTutorIds.reduce((total, tutorId) => total + coupons[tutorId].coupons.length, 0)} coupons available`}
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

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {loading ? (
                        <div className="animate-pulse">
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    ) : filteredTutorIds.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg">No active coupons available at the moment</p>
                            <p className="text-gray-400 text-sm mt-2">Check back later for new offers!</p>
                        </div>
                    ) : (

                        <div className="space-y-4">
                            {filteredTutorIds.map(tutorId => {
                                const tutorData = coupons[tutorId];
                                const isExpanded = expandedTutors[tutorId];

                                return (
                                    <div key={tutorId} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Tutor Header */}
                                        <div
                                            className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => toggleTutorExpansion(tutorId)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {tutorData.tutor.profileImage ? (
                                                        <img
                                                            src={tutorData.tutor.profileImage}
                                                            alt={tutorData.tutor.name}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-sm font-medium">
                                                                {tutorData.tutor.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{tutorData.tutor.name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {tutorData.coupons.length} coupon{tutorData.coupons.length !== 1 ? 's' : ''} available
                                                        </p>
                                                    </div>
                                                </div>
                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Coupons List */}
                                        {isExpanded && (
                                            <div className="p-4 space-y-3">
                                                {tutorData.coupons.map(coupon => {
                                                    const daysLeft = getDaysUntilExpiry(coupon.expiryDate);
                                                    const isExpiringSoon = daysLeft <= 7;

                                                    return (
                                                        <div
                                                            key={coupon._id}
                                                            className="border border-gray-200 rounded-lg p-4 hover:border-sky-300 hover:bg-sky-50 transition-colors cursor-pointer"
                                                            onClick={() => handleCouponSelect(coupon.code)}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-mono font-medium">
                                                                            {coupon.code}
                                                                        </span>
                                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                                                            {formatDiscount(coupon)}
                                                                        </span>
                                                                        {isExpiringSoon && (
                                                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                                                                {daysLeft === 0 ? 'Expires today' : `${daysLeft} days left`}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <h5 className="font-medium text-gray-900 mb-1">{coupon.title}</h5>
                                                                    {coupon.description && (
                                                                        <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                                                                    )}

                                                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                                                        {coupon.minPurchaseAmount > 0 && (
                                                                            <span>Min: ₹{coupon.minPurchaseAmount}</span>
                                                                        )}
                                                                        <span>Expires: {formatExpiryDate(coupon.expiryDate)}</span>
                                                                        {!coupon.isUnlimited && (
                                                                            <span>{coupon.remainingUses} uses left</span>
                                                                        )}
                                                                        {coupon.hasRestrictions && (
                                                                            <span className="text-orange-600">Course restrictions apply</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="ml-4 flex items-center text-sky-600">
                                                                    <span className="text-xs font-medium">Click to select</span>
                                                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
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
                            💡 Click on any coupon to select and apply it automatically
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

export default AvailableCoupons;