import cron from 'node-cron';
import PaymentDistribution from '../Model/PaymentDistributionModel.js';
import Wallet from '../Model/WalletModel.js';
import Admin from '../Model/AdminModel.js';

class PaymentDistributionService {
  constructor() {
    this.isRunning = false;
  }

  // Start the cron job - runs every hour
  startCronJob() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      if (this.isRunning) {
        return;
      }

      await this.processPaymentDistributions();
    });
  }

  // Process all pending payment distributions
  async processPaymentDistributions() {
    this.isRunning = true;
    
    try {
      const pendingDistributions = await PaymentDistribution.getPendingDistributions();

      for (const distribution of pendingDistributions) {
        try {
          await this.processDistribution(distribution);
        } catch (error) {
          await distribution.markAsFailed(error.message);
        }
      }
    } catch (error) {
    } finally {
      this.isRunning = false;
    }
  }

  // Process a single payment distribution
  async processDistribution(distribution) {

    // Update distribution status to processing
    distribution.status = 'processing';
    await distribution.save();

    // Get or create admin wallet
    const adminUser = await Admin.findOne({ role: 'super_admin' });
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    let adminWallet = await Wallet.findByOwner(adminUser._id, 'Admin');
    if (!adminWallet) {
      adminWallet = await Wallet.createWallet(adminUser._id, 'Admin');
    }

    // Get or create tutor wallet
    let tutorWallet = await Wallet.findByOwner(distribution.tutor._id, 'Tutor');
    if (!tutorWallet) {
      tutorWallet = await Wallet.createWallet(distribution.tutor._id, 'Tutor');
    }

    // Add commission to admin wallet
    if (!distribution.adminWalletUpdated) {
      const adminTransaction = {
        type: 'commission',
        amount: distribution.adminCommission,
        description: `Commission from order ${distribution.orderId} (${distribution.commissionPercentage}%)`,
        orderId: distribution.orderId,
        razorpayPaymentId: distribution.razorpayPaymentId,
        status: 'completed',
        metadata: {
          tutorId: distribution.tutor._id,
          tutorName: distribution.tutor.full_name,
          courses: distribution.courses.map(c => c.course.title || c.course)
        }
      };

      await adminWallet.addTransaction(adminTransaction);
      distribution.adminWalletUpdated = true;
    }

    // Add payment to tutor wallet
    if (!distribution.tutorWalletUpdated) {
      const tutorTransaction = {
        type: 'credit',
        amount: distribution.tutorAmount,
        description: `Payment from order ${distribution.orderId} (${100 - distribution.commissionPercentage}% share)`,
        orderId: distribution.orderId,
        razorpayPaymentId: distribution.razorpayPaymentId,
        status: 'completed',
        metadata: {
          userId: distribution.user._id,
          userName: distribution.user.full_name,
          courses: distribution.courses.map(c => c.course.title || c.course),
          originalAmount: distribution.totalAmount,
          adminCommission: distribution.adminCommission
        }
      };

      await tutorWallet.addTransaction(tutorTransaction);
      distribution.tutorWalletUpdated = true;
    }

    // Mark distribution as completed
    await distribution.markAsCompleted();
  }

  // Manual trigger for testing or immediate processing
  async processImmediately() {
    await this.processPaymentDistributions();
  }

  // Get distribution statistics
  async getDistributionStats() {
    try {
      const stats = await PaymentDistribution.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            totalAdminCommission: { $sum: '$adminCommission' },
            totalTutorAmount: { $sum: '$tutorAmount' }
          }
        }
      ]);

      const totalDistributions = await PaymentDistribution.countDocuments();
      
      return {
        totalDistributions,
        statusBreakdown: stats,
        summary: stats.reduce((acc, stat) => {
          acc.totalAmount += stat.totalAmount;
          acc.totalAdminCommission += stat.totalAdminCommission;
          acc.totalTutorAmount += stat.totalTutorAmount;
          return acc;
        }, { totalAmount: 0, totalAdminCommission: 0, totalTutorAmount: 0 })
      };
    } catch (error) {
      throw error;
    }
  }

  // Retry failed distributions
  async retryFailedDistributions() {
    try {
      const failedDistributions = await PaymentDistribution.find({
        status: 'failed',
        retryCount: { $lt: 5 }
      });

      for (const distribution of failedDistributions) {
        try {
          // Reset status to pending for retry
          distribution.status = 'pending';
          distribution.errorMessage = null;
          await distribution.save();
          
          await this.processDistribution(distribution);
        } catch (error) {
          await distribution.markAsFailed(error.message);
        }
      }
    } catch (error) {
      throw error;
    }
  }
}

// Create singleton instance
const paymentDistributionService = new PaymentDistributionService();

export default paymentDistributionService;