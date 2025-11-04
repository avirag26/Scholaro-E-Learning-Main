import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit', 'commission', 'withdrawal', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const walletSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'ownerType'
  },
  ownerType: {
    type: String,
    required: true,
    enum: ['Tutor', 'Admin']
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [transactionSchema],
  bankDetails: {
    accountNumber: {
      type: String,
      default: null
    },
    ifscCode: {
      type: String,
      default: null
    },
    accountHolderName: {
      type: String,
      default: null
    },
    bankName: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  withdrawalSettings: {
    minimumAmount: {
      type: Number,
      default: 500 // Minimum withdrawal amount
    },
    autoWithdrawal: {
      type: Boolean,
      default: false
    },
    withdrawalDay: {
      type: Number,
      default: 1, // Day of month for auto withdrawal
      min: 1,
      max: 28
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastTransactionAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
walletSchema.index({ owner: 1, ownerType: 1 }, { unique: true });
walletSchema.index({ 'transactions.orderId': 1 });
walletSchema.index({ 'transactions.razorpayPaymentId': 1 });
walletSchema.index({ 'transactions.createdAt': -1 });

// Methods
walletSchema.methods.addTransaction = function(transactionData) {
  this.transactions.push(transactionData);
  this.lastTransactionAt = new Date();
  
  if (transactionData.type === 'credit' || transactionData.type === 'commission') {
    this.balance += transactionData.amount;
    this.totalEarnings += transactionData.amount;
  } else if (transactionData.type === 'debit' || transactionData.type === 'withdrawal') {
    this.balance -= transactionData.amount;
    this.totalWithdrawals += transactionData.amount;
  }
  
  return this.save();
};

walletSchema.methods.getBalance = function() {
  return this.balance;
};

walletSchema.methods.canWithdraw = function(amount) {
  return this.balance >= amount && amount >= this.withdrawalSettings.minimumAmount;
};

// Static methods
walletSchema.statics.findByOwner = function(ownerId, ownerType) {
  return this.findOne({ owner: ownerId, ownerType });
};

walletSchema.statics.createWallet = async function(ownerId, ownerType) {
  const existingWallet = await this.findByOwner(ownerId, ownerType);
  if (existingWallet) {
    return existingWallet;
  }
  
  const wallet = new this({
    owner: ownerId,
    ownerType,
    balance: 0
  });
  
  return wallet.save();
};

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;