import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle, ChevronUp } from 'lucide-react';
import { getChatMessages, markChatAsRead } from '../../Redux/chatSlice';
import socketService from '../../services/socketService';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';

const ChatArea = ({ onBack }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const {
    activeChat,
    chats,
    messages,
    messagePagination,
    messagesLoading,
    typingUsers,
    connected
  } = useSelector(state => state.chat);
  const currentUser = useSelector(state => state.currentUser);
  const currentTutor = useSelector(state => state.currentTutor);
  const userId = currentUser.user?._id || currentTutor.tutor?._id;
  const userType = currentTutor?.isAuthenticated ? 'tutor' : 'user';

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const currentChat = chats.find(chat => chat._id === activeChat);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];
  const pagination = activeChat ? messagePagination[activeChat] : null;
  const typingInCurrentChat = activeChat ? typingUsers[activeChat] || [] : [];

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      dispatch(getChatMessages({ chatId: activeChat, page: 1 }));
      socketService.joinChat(activeChat);

      // Mark as read when opening chat
      dispatch(markChatAsRead(activeChat));
      socketService.markAsRead(activeChat);
    }

    return () => {
      if (activeChat) {
        socketService.leaveChat(activeChat);
      }
    };
  }, [activeChat, dispatch]);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (isNearBottom && chatMessages.length > 0) {
      scrollToBottom();
    }
  }, [chatMessages, isNearBottom]);

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      setIsNearBottom(distanceFromBottom < 100);
      setShowScrollButton(distanceFromBottom > 200);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMoreMessages = async () => {
    if (!activeChat || !pagination || messagesLoading) return;

    if (pagination.hasPrev) {
      const nextPage = pagination.currentPage + 1;
      await dispatch(getChatMessages({ chatId: activeChat, page: nextPage }));
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    return currentDate !== previousDate;
  };

  const isMyMessage = (message) => {
    return message.sender._id === userId;
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <MessageCircle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No chat selected</h3>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Choose a conversation from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0">
        <ChatHeader chat={currentChat} onBack={onBack} />
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 min-h-0"
      >
        {/* Load More Button */}
        {pagination && pagination.hasPrev && (
          <div className="text-center">
            <button
              onClick={loadMoreMessages}
              disabled={messagesLoading}
              className="px-4 py-2 text-sm text-sky-600 hover:text-sky-700 disabled:opacity-50"
            >
              {messagesLoading ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {/* Messages */}
        {chatMessages.map((message, index) => {
          const previousMessage = index > 0 ? chatMessages[index - 1] : null;
          const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
          const isMine = isMyMessage(message);

          return (
            <div key={message._id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatMessageDate(message.createdAt)}
                  </div>
                </div>
              )}

              {/* Message */}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-2 sm:px-0`}>
                <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                  {!isMine && (
                    <div className="flex items-center space-x-2 mb-1">
                      <img
                        src={message.sender.profileImage || '/default-avatar.png'}
                        alt={message.sender.name}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                      />
                      <span className="text-xs text-gray-600 font-medium truncate">
                        {message.sender.name}
                      </span>
                    </div>
                  )}

                  <div
                    className={`px-3 sm:px-4 py-2 rounded-lg ${isMine
                      ? 'bg-sky-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}
                  >
                    {message.messageType === 'image' ? (
                      <div className="space-y-2">
                        <img 
                          src={message.fileUrl}
                          alt={message.fileName || 'Image'}
                          className="max-w-48 sm:max-w-64 max-h-48 sm:max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.fileUrl, '_blank')}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.png';
                            e.target.alt = 'Image failed to load';
                          }}
                        />
                        {message.content !== 'Image' && (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}

                    <div className={`flex items-center justify-between mt-1 text-xs ${isMine ? 'text-sky-100' : 'text-gray-500'
                      }`}>
                      <span>{formatMessageTime(message.createdAt)}</span>
                      <div className="flex items-center space-x-1">
                        {isMine && (
                          <span className="flex items-center">
                            {message.readBy?.length > 0 || message.status === 'read' ? (
                              <span>✓✓</span>
                            ) : (
                              <span>✓</span>
                            )}
                          </span>
                        )}
                        {message.editedAt && (
                          <span className="italic">edited</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicators */}
        {typingInCurrentChat.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-600 ml-2">
                  {typingInCurrentChat.map(user => user.name).join(', ')} typing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-16 sm:bottom-20 right-4 sm:right-8 bg-sky-500 text-white p-2 rounded-full shadow-lg hover:bg-sky-600 transition-colors z-10"
        >
          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 transform rotate-180" />
        </button>
      )}

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput chatId={activeChat} />
      </div>
    </div>
  );
};

export default ChatArea;