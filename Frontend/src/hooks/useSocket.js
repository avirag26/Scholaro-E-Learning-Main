import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { store } from '../Redux/store';

export const useSocket = () => {
  const userAuth = useSelector(state => state.currentUser);
  const tutorAuth = useSelector(state => state.currentTutor);
  
  const isAuthenticated = userAuth.isAuthenticated || tutorAuth.isAuthenticated;
  const accessToken = userAuth.accessToken || tutorAuth.accessToken;

  useEffect(() => {
    // Add a small delay to prevent rapid successive calls during React StrictMode
    const timeoutId = setTimeout(() => {
      if (isAuthenticated && accessToken) {
        // Initialize socket if not already connected
        if (!socketService.isConnected()) {
          console.log('🔌 Initializing socket connection...');
          socketService.initialize(store);
        }
      } else {
        // Disconnect socket if not authenticated
        if (socketService.isConnected()) {
          console.log('🔌 Disconnecting socket...');
          socketService.disconnect();
        }
      }
    }, 100); // Small delay to debounce rapid calls

    // Cleanup timeout on unmount or dependency change
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, accessToken]);

  return {
    isConnected: socketService.isConnected(),
    connect: () => socketService.initialize(store),
    disconnect: () => socketService.disconnect(),
    reconnect: () => socketService.reconnect()
  };
};

export default useSocket;