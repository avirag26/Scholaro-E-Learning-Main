import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import TutorSidebar from './COMMON/TutorSidebar';
import WalletDashboard from '../../components/Wallet/WalletDashboard';
import { getWallet } from '../../Redux/walletSlice';
import TutorLayout from './COMMON/TutorLayout';

const TutorWallet = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Fetch wallet data when component mounts
    dispatch(getWallet());
  }, [dispatch]);

  return (
    <TutorLayout>
      <div className="min-h-screen bg-gray-50 flex">
      
      <div className="flex-1 p-6">
        <WalletDashboard userType="tutor" />
      </div>
    </div>
    </TutorLayout>
    
  );
};

export default TutorWallet;