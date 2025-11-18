import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import socketService from '../services/socketService';
import { store } from '../Redux/store';

export const useSocket = (forceConnect = false) => {
  const [isConnected, setIsConnected] = useState(false);
  // const location = useLocation();
  const userAuth = useSelector(state => state.currentUser);
  const tutorAuth = useSelector(state => state.currentTutor);

  const isAuthenticated = userAuth.isAuthenticated || tutorAuth.isAuthenticated;
  const accessToken = userAuth.accessToken || tutorAuth.accessToken;

  // Check if current page needs Socket.IO
  const needsSocket = forceConnect || ['/chat', '/messages', '/tutor/chats', '/admin/chats'].some(path =>
    location.pathname.includes(path)
  );

  useEffect(() => {
    // Only connect if authenticated, has token, and needs socket
    if (isAuthenticated && accessToken && needsSocket) {
      const timeoutId = setTimeout(() => {
        if (!socketService.isConnected()) {
          try {
            socketService.initialize(store);
            setIsConnected(true);
            console.log('✅ Socket.IO connected for chat functionality');
          } catch (error) {
            console.log('⚠️ Socket.IO connection failed, chat features may be limited');
            setIsConnected(false);
          }
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      // Disconnect if not needed or not authenticated
      if (socketService.isConnected()) {
        socketService.disconnect();
        setIsConnected(false);
        console.log('🔌 Socket.IO disconnected');
      }
    }
  }, [isAuthenticated, accessToken, needsSocket, location.pathname]);

  return {
    isConnected: isConnected && socketService.isConnected(),
    connect: () => {
      try {
        socketService.initialize(store);
        setIsConnected(true);
      } catch (error) {
        console.log('⚠️ Failed to connect to Socket.IO');
        setIsConnected(false);
      }
    },
    disconnect: () => {
      socketService.disconnect();
      setIsConnected(false);
    },
    reconnect: () => socketService.reconnect(),
    needsSocket
  };
};

export default useSocket;