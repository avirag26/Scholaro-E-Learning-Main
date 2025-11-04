import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MessageCircle } from 'lucide-react';
import { getChats, setActiveChat, getAvailableTutors, getTutorStudents, createOrGetChat, createOrGetChatByTutor } from '../../Redux/chatSlice';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
const ChatList = () => {
  const dispatch = useDispatch();
  const { 
    chats, 
    activeChat, 
    availableTutors, 
    tutorStudents, 
    onlineUsers, 
    loading 
  } = useSelector(state => state.chat);

  const currentUser = useSelector(state => state.currentUser);
  const currentTutor = useSelector(state => state.currentTutor);
  const userType = currentTutor?.isAuthenticated ? 'tutor' : 'user';
  const currentUserId = currentUser.user?._id || currentTutor.tutor?._id;
  
  const [searchTerm, setSearchTerm] = useState('');
  const isUser = currentUser.isAuthenticated;
  const isTutor = currentTutor.isAuthenticated;
  const navigate = useNavigate()

    const handleBackClick = () => {
    if (isUser) {
      navigate('/user/home');
    } else if (isTutor) {
      navigate('/tutor/home');
    }
  };
  useEffect(() => {
    dispatch(getChats());
    
    if (userType === 'user') {
      dispatch(getAvailableTutors());
    } else if (userType === 'tutor') {
      dispatch(getTutorStudents());
    }
  }, [dispatch, userType]);

  // Combine chats with available contacts (filter out self-chats)
  const allContacts = chats.filter(chat => 
    chat.participant?._id !== currentUserId
  );
  
  // Add available tutors/students that don't have existing chats
  if (userType === 'user') {
    availableTutors.forEach(tutor => {
      // Don't include the current user themselves
      if (tutor._id === currentUserId) {
        return;
      }
      
      const hasExistingChat = chats.some(chat => 
        chat.participant?._id === tutor._id
      );
      if (!hasExistingChat) {
        allContacts.push({
          _id: `tutor-${tutor._id}`,
          participant: {
            _id: tutor._id,
            name: tutor.name,
            email: tutor.email,
            profileImage: tutor.profileImage,
            type: 'tutor'
          },
          course: tutor.courses[0] || { title: 'Multiple Courses' },
          lastMessage: null,
          unreadCount: 0,
          isContact: true
        });
      }
    });
  } else {
    tutorStudents.forEach(student => {
      // Don't include the current user themselves
      if (student._id === currentUserId) {
        return;
      }
      
      const hasExistingChat = chats.some(chat => 
        chat.participant?._id === student._id
      );
      if (!hasExistingChat) {
        allContacts.push({
          _id: `student-${student._id}`,
          participant: {
            _id: student._id,
            name: student.name,
            email: student.email,
            profileImage: student.profileImage,
            type: 'user'
          },
          course: student.courses[0] || { title: 'Multiple Courses' },
          lastMessage: null,
          unreadCount: 0,
          isContact: true
        });
      }
    });
  }

  const filteredContacts = allContacts.filter(contact => {
    if (!searchTerm) return true;
    
    const participantName = contact.participant?.name?.toLowerCase() || '';
    const courseName = contact.course?.title?.toLowerCase() || '';
    
    return participantName.includes(searchTerm.toLowerCase()) || 
           courseName.includes(searchTerm.toLowerCase());
  });

  const isUserOnline = (userId, userType) => {
    return onlineUsers.some(user => 
      user.userId === userId && user.userType === userType.toLowerCase()
    );
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleContactSelect = async (contact) => {
    if (contact.isContact) {
      // This is a new contact (no existing chat)
      if (userType === 'user') {
        // Users can create new chats with tutors
        try {
          await dispatch(createOrGetChat({ 
            tutorId: contact.participant._id
          })).unwrap();
        } catch (error) {
        }
      } else {
        
        try {
          await dispatch(createOrGetChatByTutor({ 
            studentId: contact.participant._id
          })).unwrap();
        } catch (error) {
        }
      }
    } else {
    
      dispatch(setActiveChat(contact._id));
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }
  
  

  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        
        <div className="mb-4">
          
          <h2 className="text-lg font-semibold text-gray-900">
            <button
            onClick={handleBackClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
            {userType === 'user' ? 'Tutors & Chats' : 'Students & Chats'}
          </h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={userType === 'user' ? 'Search tutors and chats...' : 'Search students and chats...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      {/* Contacts and Chats List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredContacts.length === 0 ? (
          <div className="p-6 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600 mb-2">
              {userType === 'user' ? 'No tutors available' : 'No students yet'}
            </p>
            <p className="text-sm text-gray-500">
              {userType === 'user' 
                ? 'Purchase a course to start chatting with tutors' 
                : 'Students will appear here when they enroll in your courses'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => handleContactSelect(contact)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !contact.isContact && activeChat === contact._id ? 'bg-sky-50 border-r-2 border-sky-500' : ''
                } ${contact.isContact ? 'bg-gray-25' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={contact.participant?.profileImage || '/default-avatar.png'}
                      alt={contact.participant?.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {isUserOnline(contact.participant?._id, contact.participant?.type) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {contact.participant?.name || 'Unknown User'}
                        </h3>
                        {isUserOnline(contact.participant?._id, contact.participant?.type) && (
                          <span className="text-xs text-green-600 font-medium">Online</span>
                        )}
                      </div>
                      {!contact.isContact && (
                        <span className="text-xs text-gray-500">
                          {formatLastMessageTime(contact.lastMessage?.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {contact.isContact 
                          ? (userType === 'user' ? 'Click to start chat' : 'Click to start chat')
                          : (contact.lastMessage?.content || 'No messages yet')
                        }
                      </p>
                      {!contact.isContact && contact.unreadCount > 0 && (
                        <span className="ml-2 bg-sky-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
};

export default ChatList;