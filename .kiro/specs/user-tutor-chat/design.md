# User-Tutor Chat System Design

## Overview

The chat system will be built using Socket.IO for real-time communication, with a React frontend and Node.js backend. The system will enforce course enrollment restrictions and support multi-device connectivity.

## Architecture

### Backend Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Socket.IO     │    │   Chat API      │    │   Database      │
│   Server        │◄──►│   Controllers   │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Room          │    │   Authentication│
│   Management    │    │   Middleware    │
└─────────────────┘    └─────────────────┘
```

### Frontend Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat Pages    │◄──►│   Redux Store   │◄──►│   Socket.IO     │
│   (User/Tutor)  │    │   (Chat Slice)  │    │   Client        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Chat          │    │   Chat          │
│   Components    │    │   Services      │
└─────────────────┘    └─────────────────┘
```

## Components and Interfaces

### Database Models

#### Chat Model
```javascript
{
  _id: ObjectId,
  participants: [
    {
      user: ObjectId, // User or Tutor ID
      userType: String, // 'user' or 'tutor'
      joinedAt: Date
    }
  ],
  course: ObjectId, // Course reference
  lastMessage: {
    content: String,
    sender: ObjectId,
    timestamp: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Message Model
```javascript
{
  _id: ObjectId,
  chat: ObjectId, // Chat reference
  sender: ObjectId, // User or Tutor ID
  senderType: String, // 'user' or 'tutor'
  content: String,
  messageType: String, // 'text', 'image', 'file'
  readBy: [
    {
      user: ObjectId,
      readAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Socket.IO Events

#### Client to Server Events
- `join_chat`: Join a specific chat room
- `send_message`: Send a new message
- `typing_start`: Indicate user is typing
- `typing_stop`: Indicate user stopped typing
- `mark_read`: Mark messages as read

#### Server to Client Events
- `message_received`: New message received
- `user_online`: User came online
- `user_offline`: User went offline
- `typing_indicator`: Someone is typing
- `message_read`: Message was read
- `error`: Error occurred

### API Endpoints

#### Chat Management
- `GET /api/chats` - Get user's chat list
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats` - Create new chat
- `PUT /api/chats/:chatId/read` - Mark chat as read

#### User/Tutor Specific
- `GET /api/users/available-tutors` - Get tutors from purchased courses
- `GET /api/tutors/students` - Get students from tutor's courses

## Data Models

### Chat State (Redux)
```javascript
{
  chats: {
    list: [], // Array of chat objects
    activeChat: null, // Currently selected chat
    messages: {}, // Messages by chat ID
    onlineUsers: [], // List of online user IDs
    typingUsers: {}, // Typing indicators by chat ID
    loading: false,
    error: null
  }
}
```

### Socket Connection Management
```javascript
{
  socket: null, // Socket.IO instance
  connected: false,
  reconnecting: false,
  rooms: [], // Joined room IDs
}
```

## Error Handling

### Authentication Errors
- Invalid token: Disconnect socket and redirect to login
- Expired session: Refresh token or redirect to login

### Permission Errors
- Unauthorized chat access: Show error message and prevent access
- Course not purchased: Display upgrade prompt

### Connection Errors
- Network issues: Show reconnection status
- Server errors: Display user-friendly error messages

## Testing Strategy

### Unit Tests
- Chat slice reducers and actions
- Socket event handlers
- Message validation functions
- Permission checking utilities

### Integration Tests
- Socket.IO connection flow
- Message sending and receiving
- Room joining and leaving
- Authentication middleware

### End-to-End Tests
- Complete chat conversation flow
- Multi-device synchronization
- Course enrollment verification
- Real-time message delivery

## Security Considerations

### Authentication
- JWT token validation for socket connections
- Course enrollment verification before chat access
- Rate limiting for message sending

### Data Validation
- Message content sanitization
- File upload restrictions
- Input length limitations

### Privacy
- Messages encrypted in transit
- Access logs for audit purposes
- User blocking capabilities

## Performance Optimizations

### Message Loading
- Pagination for chat history
- Lazy loading of older messages
- Message caching strategies

### Socket Management
- Connection pooling
- Room-based message broadcasting
- Efficient user presence tracking

### Database Optimization
- Indexed queries for chat lookup
- Message archiving for old conversations
- Optimized aggregation pipelines