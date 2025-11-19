import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Phone, Video, MoreVertical, BookOpen, User, Trash2, ArrowLeft } from 'lucide-react';
import { clearChat } from '../../Redux/chatSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
const ChatHeader = ({ chat, onBack }) => {
  const navigate= useNavigate();
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
    <div className="border-b border-gray-200 bg-white px-3 sm:px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Side - Back button (mobile) + Participant Info */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          {/* Avatar with Online Status */}
          <div className="relative flex-shrink-0">
            <img
              src={chat.participant?.profileImage || '/default-avatar.png'}
              alt={chat.participant?.name || 'Unknown User'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
            />
            {isParticipantOnline() && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          {/* Name and Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                {chat.participant?.name || 'Unknown User'}
              </h3>
              <div className="hidden sm:flex items-center space-x-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500 capitalize">
                  {chat.participant?.type || 'user'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 mt-0.5 sm:mt-1">
              <span className={`text-xs sm:text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Call Button (UI Only) - Hidden on mobile */}
          <button
            className="hidden sm:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Voice call (Coming soon)"
            onClick={() => {
              // TODO: Implement voice call functionality
              alert('Voice call feature coming soon!');
            }}
          >
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Video Call Button (UI Only) - Hidden on mobile */}
          <button
            className="hidden sm:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Video call (Coming soon)"
            onClick={() => {
              // TODO: Implement video call functionality
              navigate('/video/videoinput')
            }}
          >
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="More options"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  {/* Mobile-only call options */}
                  <div className="sm:hidden">
                    <button
                      onClick={() => {
                        alert('Voice call feature coming soon!');
                        setShowMoreMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="h-4 w-4 mr-3" />
                      Voice Call
                    </button>
                    <button
                      onClick={() => {
                        // alert('Video call feature coming soon!');
                        // setShowMoreMenu(false);
                        navigate('/video/videoinput')
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Video className="h-4 w-4 mr-3" />
                      Video Call
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                  </div>
                  
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
                    className="flex items-center w-full px-3 sm:px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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

      {/* Available Courses Info - Responsive */}
      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-sky-50 rounded-lg border border-sky-100">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <p className="text-xs sm:text-sm font-medium text-sky-900">
            <span className="hidden sm:inline">Your Courses with {chat.participant?.name}</span>
            <span className="sm:hidden">Courses</span>
          </p>
        </div>
        
        {/* Course Tags - Responsive */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {chat.participant?.courses?.map((course) => (
            <div
              key={course._id}
              className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white border border-sky-200 rounded-full text-xs text-sky-800"
            >
              <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
              <span className="truncate max-w-20 sm:max-w-none">{course.title}</span>
            </div>
          )) || (
            <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white border border-sky-200 rounded-full text-xs text-sky-800">
              <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
              <span className="truncate max-w-20 sm:max-w-none">{chat.course?.title || 'Course'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;