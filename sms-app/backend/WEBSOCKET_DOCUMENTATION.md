# WebSocket Implementation Documentation

## Overview
The SMS maintenance portal now includes real-time messaging capabilities using Socket.io. This enables team communication, HSE alerts, and presence tracking.

## Features

### 1. Real-time Messaging
- Send and receive messages in channels
- Edit and delete messages
- Message read receipts
- Typing indicators
- File attachments support

### 2. Channel Management
- Team channels (by vessel/department)
- Direct messaging channels
- HSE announcement channels
- Private/public channel support
- Channel member management

### 3. HSE Alerts
- Create critical safety alerts
- Fleet-wide, vessel-specific, or department-specific alerts
- Acknowledgment tracking
- Automatic broadcasting based on severity

### 4. Presence Tracking
- Online/offline status
- Last seen timestamps
- Automatic presence updates every 30 seconds

## Client-Side Implementation

### Connection Setup
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3005', {
  auth: {
    token: localStorage.getItem('accessToken') // JWT token
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### Sending Messages
```javascript
// Send a text message
socket.emit('message:send', {
  channelId: 123,
  content: 'Hello team!',
  messageType: 'text'
});

// Listen for new messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
});
```

### Typing Indicators
```javascript
// Start typing
socket.emit('typing:start', {
  channelId: 123,
  isTyping: true
});

// Stop typing
socket.emit('typing:stop', {
  channelId: 123,
  isTyping: false
});

// Listen for typing events
socket.on('typing:user', (data) => {
  console.log(`${data.userName} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
});
```

### HSE Alerts
```javascript
// Create HSE alert (requires HSE role)
socket.emit('hse:alert', {
  title: 'Safety Alert: Fire Drill',
  content: 'Mandatory fire drill at 14:00 hours',
  severity: 'high',
  scope: 'vessel',
  vesselId: 1
});

// Listen for HSE alerts
socket.on('hse:newAlert', (alert) => {
  console.log('New HSE alert:', alert);
  // Show notification to user
});

// Acknowledge HSE alert
socket.emit('hse:acknowledge', {
  updateId: 456,
  comments: 'Acknowledged and will participate'
});
```

### Presence Updates
```javascript
// Listen for presence updates
socket.on('presence:update', (data) => {
  console.log(`${data.userName} is ${data.isOnline ? 'online' : 'offline'}`);
});
```

## API Endpoints

### Channels
- `GET /api/channels` - Get all user's channels
- `GET /api/channels/:channelId` - Get channel details
- `GET /api/channels/:channelId/messages` - Get channel messages (paginated)
- `POST /api/channels` - Create new channel
- `PUT /api/channels/:channelId` - Update channel
- `POST /api/channels/:channelId/members` - Add members
- `DELETE /api/channels/:channelId/members/:userId` - Remove member

### HSE Updates
- `GET /api/hse/updates` - Get HSE updates (with filters)
- `GET /api/hse/updates/:updateId` - Get specific update
- `POST /api/hse/updates` - Create HSE update (HSE role required)
- `PUT /api/hse/updates/:updateId` - Update HSE update
- `POST /api/hse/updates/:updateId/acknowledge` - Acknowledge update
- `GET /api/hse/updates/:updateId/acknowledgments/stats` - Get acknowledgment statistics

## WebSocket Events Reference

### Client to Server Events
- `message:send` - Send a message
- `message:edit` - Edit a message
- `message:delete` - Delete a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `hse:alert` - Create HSE alert
- `hse:acknowledge` - Acknowledge HSE update
- `channel:join` - Join a channel
- `channel:leave` - Leave a channel
- `messages:markRead` - Mark messages as read

### Server to Client Events
- `message:new` - New message received
- `message:edited` - Message was edited
- `message:deleted` - Message was deleted
- `typing:user` - User typing status
- `hse:newAlert` - New HSE alert
- `hse:acknowledged` - HSE alert acknowledged
- `hse:userAcknowledged` - Another user acknowledged HSE alert
- `channel:joined` - Successfully joined channel
- `channel:left` - Successfully left channel
- `presence:update` - User presence update
- `messages:markedRead` - Messages marked as read
- `error` - Error occurred

## Authentication
All WebSocket connections require a valid JWT token passed in the auth object during connection. The token is verified on connection and the user's information is attached to the socket instance.

## Room Structure
Users are automatically joined to rooms based on:
- Individual channels they're members of: `channel:{channelId}`
- Their vessel: `vessel:{vesselId}`
- Their department: `department:{department}`
- Their company: `company:{companyId}`

This allows for efficient message routing and broadcasting.

## Security Considerations
1. All connections require authentication
2. Channel access is verified before allowing message operations
3. Role-based permissions for HSE alerts
4. Message ownership verified for edit/delete operations
5. IP addresses and user agents logged for HSE acknowledgments

## Database Schema
The implementation uses the following main tables:
- `channels` - Channel definitions
- `channel_members` - Channel membership
- `messages` - Chat messages
- `message_reads` - Read receipts
- `hse_updates` - HSE alerts and updates
- `hse_acknowledgments` - HSE acknowledgment tracking
- `file_attachments` - File attachments for messages and HSE updates