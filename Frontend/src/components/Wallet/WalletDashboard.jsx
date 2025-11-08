import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { getWallet } from '../../Redux/walletSlice';
import { tutorAPI, adminAPI } from '../../api/axiosConfig';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Clock,
    Download,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';

const WalletDashboard = ({ userType = 'tutor' }) => {
    const dispatch = useDispatch();
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');


    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [transactionType, setTransactionType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchWalletData();
    }, []);

    useEffect(() => {
        if (activeTab === 'transactions') {
            fetchTransactions();
        }
    }, [activeTab, currentPage, transactionType]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const response = await dispatch(getWallet()).unwrap();
            setWalletData(response);
        } catch (error) {
            toast.error('Failed to fetch wallet data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setTransactionsLoading(true);
            const api = userType === 'admin' ? adminAPI : tutorAPI;
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '5',
                type: transactionType
            });

            const endpoint = userType === 'admin' ? '/api/admin/wallet/transactions' : `/api/${userType}s/wallet/transactions`;
            const response = await api.get(`${endpoint}?${params}`);
            const data = response.data;

            setTransactions(data.transactions || []);
            setTotalPages(data.pagination?.totalPages || 1);

        } catch (error) {
            toast.error('Failed to fetch transactions');
        } finally {
            setTransactionsLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleTypeFilter = (type) => {
        setTransactionType(type);
        setCurrentPage(1);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'credit':
            case 'commission':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'debit':
            case 'withdrawal':
                return <TrendingDown className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTransactionColor = (type) => {
        switch (type) {
            case 'credit':
            case 'commission':
                return 'text-green-600';
            case 'debit':
            case 'withdrawal':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    if (!walletData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Wallet className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Wallet Data</h3>
                <p className="text-sm text-center">
                    {userType === 'admin'
                        ? 'No wallet data available. Wallet will be created automatically when first payment is received.'
                        : 'Your wallet will be created automatically when you receive your first payment from course sales.'
                    }
                </p>
                <button
                    onClick={fetchWalletData}
                    className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Wallet className="h-8 w-8 text-sky-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {userType === 'admin' ? 'Admin Wallet' : 'My Wallet'}
                        </h1>
                        <p className="text-gray-600">Manage your earnings and withdrawals</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {userType === 'tutor' && (
                        <button className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center space-x-2">
                            <Download className="h-4 w-4" />
                            <span>Withdraw</span>
                        </button>
                    )}

                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Wallet className="h-5 w-5" />
                            <span className="text-sm opacity-90">Current Balance</span>
                        </div>
                        <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="text-white hover:text-gray-200"
                        >
                            {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                    </div>
                    <div className="text-2xl font-bold">
                        {showBalance ? formatCurrency(walletData?.balance || 0) : '••••••'}
                    </div>
                </div>


                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-600">Total Earnings</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(walletData?.totalEarnings || 0)}
                    </div>
                </div>


                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-4">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-gray-600">Total Withdrawals</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(walletData?.totalWithdrawals || 0)}
                    </div>
                </div>


                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-4">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(walletData?.pendingAmount || 0)}
                    </div>
                </div>
            </div>


            <div className="bg-white rounded-xl border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                ? 'border-sky-500 text-sky-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'transactions'
                                ? 'border-sky-500 text-sky-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            All Transactions
                        </button>
                        {userType === 'tutor' && (
                            <button
                                onClick={() => setActiveTab('bank')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'bank'
                                    ? 'border-sky-500 text-sky-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Bank Details
                            </button>
                        )}

                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                                <div className="space-y-3">
                                    {walletData?.recentTransactions?.length > 0 ? (
                                        walletData.recentTransactions.map((transaction) => (
                                            <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getTransactionIcon(transaction.type)}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{transaction.description}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(transaction.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                                                        {transaction.type === 'credit' || transaction.type === 'commission' ? '+' : '-'}
                                                        {formatCurrency(transaction.amount)}
                                                    </p>
                                                    <p className="text-sm text-gray-500 capitalize">{transaction.status}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm">No transactions yet</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Transactions will appear here when you receive payments or make withdrawals
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>


                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <div className="space-y-6">

                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
                                >
                                    <Filter className="w-3 h-3" />
                                    <span>Filter</span>
                                </button>
                            </div>


                            {showFilters && (
                                <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">Type:</span>
                                        <select
                                            value={transactionType}
                                            onChange={(e) => handleTypeFilter(e.target.value)}
                                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="credit">Credit</option>
                                            <option value="debit">Debit</option>
                                            <option value="commission">Commission</option>
                                            <option value="withdrawal">Withdrawal</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setTransactionType('all');
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}


                            <div className="space-y-3">
                                {transactionsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                                    </div>
                                ) : transactions.length > 0 ? (
                                    transactions.map((transaction) => (
                                        <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                {getTransactionIcon(transaction.type)}
                                                <div>
                                                    <p className="font-medium text-gray-900">{transaction.description}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                                                    {transaction.type === 'credit' || transaction.type === 'commission' ? '+' : '-'}
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                <p className={`text-sm capitalize px-2 py-1 rounded-full text-xs ${transaction.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                                        'bg-red-100 text-red-600'
                                                    }`}>
                                                    {transaction.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">
                                            {transactionType !== 'all' ? `No ${transactionType} transactions found` : 'No transactions yet'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Transactions will appear here when you receive payments or make withdrawals
                                        </p>
                                    </div>
                                )}
                            </div>


                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`flex items-center px-3 py-1 rounded text-sm ${currentPage === 1
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" />
                                            Previous
                                        </button>


                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-3 py-1 rounded text-sm ${currentPage === pageNum
                                                            ? 'bg-sky-500 text-white'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`flex items-center px-3 py-1 rounded text-sm ${currentPage === totalPages
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'bank' && userType === 'tutor' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
                            <p className="text-gray-600">Bank account management will be displayed here...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletDashboard;