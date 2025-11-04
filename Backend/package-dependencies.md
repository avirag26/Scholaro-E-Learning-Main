# Required Dependencies for Wallet System

Add these dependencies to your Backend package.json:

```bash
cd Backend
npm install node-cron
```

The `node-cron` package is needed for the hourly payment distribution cron job.

## Frontend Routes Added:
- `/tutor/wallet` - Tutor wallet dashboard
- `/admin/wallet` - Admin wallet dashboard

## Backend Routes Added:
- `GET /api/tutors/wallet` - Get tutor wallet details
- `GET /api/tutors/wallet/transactions` - Get tutor transactions
- `PUT /api/tutors/wallet/bank-details` - Update bank details
- `POST /api/tutors/wallet/withdraw` - Request withdrawal
- `GET /api/admin/wallet` - Get admin wallet details
- `GET /api/admin/wallet/transactions` - Get admin transactions
- `GET /api/admin/wallet/statistics` - Get wallet statistics

## Dependencies Added:
- `node-cron`: For scheduling the hourly payment distribution task

## Usage:
The cron job will automatically:
1. Run every hour (at minute 0)
2. Find all pending payment distributions
3. Calculate 10% commission for admin
4. Transfer 90% to tutor wallets
5. Update wallet balances and transaction history
6. Mark distributions as completed

## Manual Triggers:
You can also manually trigger payment distribution:
```javascript
import paymentDistributionService from './services/paymentDistributionService.js';

// Process immediately
await paymentDistributionService.processImmediately();

// Retry failed distributions
await paymentDistributionService.retryFailedDistributions();

// Get statistics
const stats = await paymentDistributionService.getDistributionStats();
```