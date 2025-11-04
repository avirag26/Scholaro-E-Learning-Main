import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AdminLayout from './common/AdminLayout';
import WalletDashboard from '../../components/Wallet/WalletDashboard';
import { getWallet, getWalletStatistics } from '../../Redux/walletSlice';

const AdminWallet = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Fetch wallet data and statistics when component mounts
    dispatch(getWallet());
    dispatch(getWalletStatistics());
  }, [dispatch]);

  return (
    <AdminLayout title="Wallet Management" subtitle="Manage platform earnings and tutor payments">
      <WalletDashboard userType="admin" />
    </AdminLayout>
  );
};

export default AdminWallet;