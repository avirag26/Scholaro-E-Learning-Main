import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ChatList from './ChatList';
import ChatArea from './ChatArea';
import useSocket from '../../hooks/useSocket';

const UnifiedChat = () => {
    const navigate = useNavigate();

    // Check both user and tutor authentication
    const userAuth = useSelector(state => state.currentUser);
    const tutorAuth = useSelector(state => state.currentTutor);
    const { connected, reconnecting } = useSelector(state => state.chat);

    const isAuthenticated = userAuth.isAuthenticated || tutorAuth.isAuthenticated;
    const userType = tutorAuth.isAuthenticated ? 'tutor' : 'user';

    // Initialize socket connection
    const { reconnect } = useSocket();

    useEffect(() => {
        // Check authentication
        if (!isAuthenticated) {
            const loginPath = userType === 'tutor' ? '/tutor/login' : '/user/login';
            navigate(loginPath);
            return;
        }
    }, [isAuthenticated, navigate, userType]);

    // Handle connection errors
    useEffect(() => {
        if (!connected && !reconnecting && isAuthenticated) {
            // Show connection error after a delay to avoid showing on initial load
            const timer = setTimeout(() => {
                toast.error('Unable to connect to chat server. Please check your connection.');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [connected, reconnecting, isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                    <p className="text-gray-600 mb-4">Please log in to access the chat feature.</p>
                    <button
                        onClick={() => navigate(userType === 'tutor' ? '/tutor/login' : '/user/login')}
                        className={`px-6 py-3 text-white rounded-lg transition-colors ${userType === 'tutor'
                            ? 'bg-teal-600 hover:bg-teal-700'
                            : 'bg-sky-500 hover:bg-sky-600'
                            }`}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex-1 flex bg-white rounded-lg shadow-sm overflow-hidden min-h-0">
                {/* Chat Sidebar */}
                <div className="md:w-80 flex-shrink-0 h-full">
                    <ChatList />
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-h-0 h-full relative">
                    <ChatArea />

                    {/* Connection Status Overlay */}
                    {reconnecting && (
                        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm z-10">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Reconnecting to chat server...</span>
                            </div>
                        </div>
                    )}

                    {!connected && !reconnecting && (
                        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-center text-sm z-10">
                            <div className="flex items-center justify-center space-x-2">
                                <span>⚠️ Disconnected from chat server</span>
                                <button
                                    onClick={reconnect}
                                    className="ml-2 underline hover:no-underline"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnifiedChat;