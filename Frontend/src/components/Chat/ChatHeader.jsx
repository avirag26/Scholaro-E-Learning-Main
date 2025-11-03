import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Phone, Video, MoreVertical, BookOpen, User, Trash2 } from 'lucide-react';
import { clearChat } from '../../Redux/chatSlice';
import { toast } from 'react-toastify';

const ChatHeader = ({ chat }) => {
  const dispatch = useDispatch();
  const { onlineUsers } = useSelector(state => state.chat);


  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (!chat) {
    return (
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  // Safety check: if participant is missing, show error
  if (!chat.participant) {
    return (
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="text-red-600 text-center">
          <p>Error: Chat participant not found</p>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }



  const isParticipantOnline = () => {
    if (!chat.participant) return false;
    
    return onlineUsers.some(user => 
      user.userId === chat.participant._id && 
      user.userType === chat.participant.type
    );
  };

  const getStatusText = () => {
    if (isParticipantOnline()) {
      return 'Online';
    }
    return 'Offline';
  };

  const getStatusColor = () => {
    return isParticipantOnline() ? 'text-green-600' : 'text-gray-500';
  };

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Side - Participant Info */}
        <div className="flex items-center space-x-3">
          {/* Avatar with Online Status */}
          <div className="relative">
            <img
              src={chat.participant?.profileImage || '/default-avatar.png'}
              alt={chat.participant?.name || 'Unknown User'}
              className="w-10 h-10 rounded-full object-cover"
            />
            {isParticipantOnline() && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {chat.participant?.name || 'Unknown User'}
              </h3>
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500 capitalize">
                  {chat.participant?.type || 'user'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-1">
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              
              
              
            </div>
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Call Button (UI Only) */}
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Voice call (Coming soon)"
            onClick={() => {
              // TODO: Implement voice call functionality
              alert('Voice call feature coming soon!');
            }}
          >
            <Phone className="h-5 w-5" />
          </button>

          {/* Video Call Button (UI Only) */}
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Video call (Coming soon)"
            onClick={() => {
              // TODO: Implement video call functionality
              alert('Video call feature coming soon!');
            }}
          >
            <Video className="h-5 w-5" />
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="More options"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={async () => {
                    
                        try {
                          await dispatch(clearChat(chat._id)).unwrap();
                          toast.success('Chat cleared successfully');
                        } catch (error) {
                          toast.error('Failed to clear chat: ' + error);
                        }
                      
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-3" />
                    Clear Chat
                  </button>
                </div>
              </div>
            )}

            {/* Overlay to close menu */}
            {showMoreMenu && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMoreMenu(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Available Courses Info */}
      <div className="mt-3 p-3 bg-sky-50 rounded-lg border border-sky-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-sky-900">
            Your Courses with {chat.participant?.name}
          </p>
        
        </div>
        
        {/* Course Tags */}
        <div className="flex flex-wrap gap-2">
          {chat.participant?.courses?.map((course) => (
            <div
              key={course._id}
              className="inline-flex items-center px-2 py-1 bg-white border border-sky-200 rounded-full text-xs text-sky-800"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              {course.title}
            </div>
          )) || (
            <div className="inline-flex items-center px-2 py-1 bg-white border border-sky-200 rounded-full text-xs text-sky-800">
              <BookOpen className="h-3 w-3 mr-1" />
              {chat.course?.title || 'Course'}
            </div>
          )}
        </div>
        
        
      </div>
    </div>
  );
};

export default ChatHeader;