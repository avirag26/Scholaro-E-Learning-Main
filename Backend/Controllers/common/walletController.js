import Wallet from '../../Model/WalletModel.js';
import PaymentDistribution from '../../Model/PaymentDistributionModel.js';

export const getWallet = async (req, res) => {
  try {
    let userId, userType;

    if (req.tutor) {
      userId = req.tutor._id;
      userType = 'Tutor';
    } else if (req.admin) {
      userId = req.admin._id;
      userType = 'Admin';
    } else if (req.user) {
      const routePath = req.route?.path || req.originalUrl;
      if (routePath.includes('/admin/')) {
        userId = req.user._id;
        userType = 'Admin';
      } else if (routePath.includes('/tutor/')) {
        userId = req.user._id;
        userType = 'Tutor';
      } else {
        return res.status(403).json({
          success: false,
          message: 'Users do not have wallets'
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let wallet = await Wallet.findByOwner(userId, userType);

    if (!wallet) {
      wallet = await Wallet.createWallet(userId, userType);
    }

    const recentTransactions = wallet.transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.status(200).json({
      success: true,
      wallet: {
        balance: wallet.balance,
        totalEarnings: wallet.totalEarnings,
        totalWithdrawals: wallet.totalWithdrawals,
        pendingAmount: wallet.pendingAmount,
        bankDetails: wallet.bankDetails,
        withdrawalSettings: wallet.withdrawalSettings,
        recentTransactions,
        isActive: wallet.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet details',
      error: error.message
    });
  }
};

export const getWalletTransactions = async (req, res) => {
  try {
    let userId, userType;

    if (req.tutor) {
      userId = req.tutor._id;
      userType = 'Tutor';
    } else if (req.admin) {
      userId = req.admin._id;
      userType = 'Admin';
    } else if (req.user) {
      const routePath = req.route?.path || req.originalUrl;
      if (routePath.includes('/admin/')) {
        userId = req.user._id;
        userType = 'Admin';
      } else if (routePath.includes('/tutor/')) {
        userId = req.user._id;
        userType = 'Tutor';
      } else {
        return res.status(403).json({
          success: false,
          message: 'Users do not have wallets'
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 5, type, startDate, endDate } = req.query;

    const wallet = await Wallet.findByOwner(userId, userType);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    let transactionFilter = {};
    if (type && type !== 'all') {
      transactionFilter.type = type;
    }
    if (startDate || endDate) {
      transactionFilter.createdAt = {};
      if (startDate) transactionFilter.createdAt.$gte = new Date(startDate);
      if (endDate) transactionFilter.createdAt.$lte = new Date(endDate);
    }

    let filteredTransactions = wallet.transactions;
    if (Object.keys(transactionFilter).length > 0) {
      filteredTransactions = wallet.transactions.filter(transaction => {
        if (transactionFilter.type && transaction.type !== transactionFilter.type) {
          return false;
        }
        if (transactionFilter.createdAt) {
          const transactionDate = new Date(transaction.createdAt);
          if (transactionFilter.createdAt.$gte && transactionDate < transactionFilter.createdAt.$gte) {
            return false;
          }
          if (transactionFilter.createdAt.$lte && transactionDate > transactionFilter.createdAt.$lte) {
            return false;
          }
        }
        return true;
      });
    }

    filteredTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredTransactions.length / limit),
        totalTransactions: filteredTransactions.length,
        hasNext: endIndex < filteredTransactions.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

export const updateBankDetails = async (req, res) => {
  try {
    let userId, userType;

    if (req.tutor) {
      userId = req.tutor._id;
      userType = 'Tutor';
    } else if (req.admin) {
      userId = req.admin._id;
      userType = 'Admin';
    } else if (req.user) {
      const routePath = req.route?.path || req.originalUrl;
      if (routePath.includes('/admin/')) {
        userId = req.user._id;
        userType = 'Admin';
      } else if (routePath.includes('/tutor/')) {
        userId = req.user._id;
        userType = 'Tutor';
      } else {
        return res.status(403).json({
          success: false,
          message: 'Users cannot update bank details'
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { accountNumber, ifscCode, accountHolderName, bankName } = req.body;

    if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
      return res.status(400).json({
        success: false,
        message: 'All bank details are required'
      });
    }

    let wallet = await Wallet.findByOwner(userId, userType);
    if (!wallet) {
      wallet = await Wallet.createWallet(userId, userType);
    }

    wallet.bankDetails = {
      accountNumber,
      ifscCode: ifscCode.toUpperCase(),
      accountHolderName,
      bankName,
      isVerified: false
    };

    await wallet.save();

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
      bankDetails: wallet.bankDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating bank details',
      error: error.message
    });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    let userId, userType;

    if (req.tutor) {
      userId = req.tutor._id;
      userType = 'Tutor';
    } else if (req.admin) {
      userId = req.admin._id;
      userType = 'Admin';
    } else if (req.user) {
      const routePath = req.route?.path || req.originalUrl;
      if (routePath.includes('/admin/')) {
        userId = req.user._id;
        userType = 'Admin';
      } else if (routePath.includes('/tutor/')) {
        userId = req.user._id;
        userType = 'Tutor';
      } else {
        return res.status(403).json({
          success: false,
          message: 'Users cannot request withdrawals'
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal amount'
      });
    }

    const wallet = await Wallet.findByOwner(userId, userType);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (!wallet.bankDetails.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Bank details not verified. Please update and verify your bank details.'
      });
    }

    if (!wallet.canWithdraw(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance or amount below minimum withdrawal limit (₹${wallet.withdrawalSettings.minimumAmount})`
      });
    }

    const transaction = {
      type: 'withdrawal',
      amount: amount,
      description: `Withdrawal request to ${wallet.bankDetails.bankName} (${wallet.bankDetails.accountNumber.slice(-4)})`,
      status: 'pending'
    };

    await wallet.addTransaction(transaction);

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      transaction: wallet.transactions[wallet.transactions.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing withdrawal request',
      error: error.message
    });
  }
};

export const getWalletStatistics = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const tutorWallets = await Wallet.find({ ownerType: 'Tutor' })
      .populate('owner', 'full_name email');

    const adminWallet = await Wallet.findOne({ ownerType: 'Admin' });

    const totalTutorBalance = tutorWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const totalTutorEarnings = tutorWallets.reduce((sum, wallet) => sum + wallet.totalEarnings, 0);
    const totalTutorWithdrawals = tutorWallets.reduce((sum, wallet) => sum + wallet.totalWithdrawals, 0);

    const pendingDistributions = await PaymentDistribution.find({ status: 'pending' });
    const totalPendingAmount = pendingDistributions.reduce((sum, dist) => sum + dist.totalAmount, 0);

    res.status(200).json({
      success: true,
      statistics: {
        totalTutors: tutorWallets.length,
        totalTutorBalance,
        totalTutorEarnings,
        totalTutorWithdrawals,
        adminBalance: adminWallet?.balance || 0,
        adminTotalEarnings: adminWallet?.totalEarnings || 0,
        pendingDistributions: pendingDistributions.length,
        totalPendingAmount,
        tutorWallets: tutorWallets.map(wallet => ({
          tutorId: wallet.owner._id,
          tutorName: wallet.owner.full_name,
          tutorEmail: wallet.owner.email,
          balance: wallet.balance,
          totalEarnings: wallet.totalEarnings,
          totalWithdrawals: wallet.totalWithdrawals,
          lastTransactionAt: wallet.lastTransactionAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet statistics',
      error: error.message
    });
  }
};