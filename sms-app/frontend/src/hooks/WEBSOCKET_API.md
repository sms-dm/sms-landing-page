# WebSocket API Documentation for Team Chat

## Connection

WebSocket URL: `ws://localhost:5001/ws?token={JWT_TOKEN}`

## Message Types

### Client to Server

#### 1. Join Channels
```json
{
  "type": "join_channels",
  "payload": {
    "userId": 123,
    "role": "technician"
  }
}
```

#### 2. Send Message
```json
{
  "type": "send_message",
  "payload": {
    "channelId": "electrical-team",
    "content": "Hello team!",
    "attachments": ["file1.pdf", "file2.jpg"]
  }
}
```

#### 3. Start Typing
```json
{
  "type": "typing_start",
  "payload": {
    "channelId": "electrical-team",
    "userId": 123,
    "userName": "John Doe"
  }
}
```

#### 4. Stop Typing
```json
{
  "type": "typing_stop",
  "payload": {
    "channelId": "electrical-team",
    "userId": 123
  }
}
```

#### 5. Mark Channel as Read
```json
{
  "type": "mark_read",
  "payload": {
    "channelId": "electrical-team"
  }
}
```

#### 6. Get Message History
```json
{
  "type": "get_history",
  "payload": {
    "channelId": "electrical-team"
  }
}
```

### Server to Client

#### 1. New Message
```json
{
  "type": "new_message",
  "payload": {
    "id": "msg-123",
    "channelId": "electrical-team",
    "userId": 123,
    "userName": "John Doe",
    "userRole": "technician",
    "content": "Hello team!",
    "timestamp": "2024-01-15T10:30:00Z",
    "attachments": [
      {
        "id": "att-1",
        "name": "circuit-diagram.pdf",
        "url": "/api/files/att-1",
        "type": "application/pdf"
      }
    ]
  }
}
```

#### 2. Typing Start
```json
{
  "type": "typing_start",
  "payload": {
    "userId": 123,
    "userName": "John Doe",
    "channelId": "electrical-team"
  }
}
```

#### 3. Typing Stop
```json
{
  "type": "typing_stop",
  "payload": {
    "userId": 123,
    "channelId": "electrical-team"
  }
}
```

#### 4. User Online
```json
{
  "type": "user_online",
  "payload": {
    "userId": 123,
    "userName": "John Doe",
    "status": "online"
  }
}
```

#### 5. User Offline
```json
{
  "type": "user_offline",
  "payload": {
    "userId": 123
  }
}
```

#### 6. Message History
```json
{
  "type": "message_history",
  "payload": {
    "channelId": "electrical-team",
    "messages": [
      {
        "id": "msg-1",
        "channelId": "electrical-team",
        "userId": 123,
        "userName": "John Doe",
        "userRole": "technician",
        "content": "Previous message",
        "timestamp": "2024-01-15T09:00:00Z"
      }
    ]
  }
}
```

## Channel Types

### Default Channels by Role

- **Electrical Manager / Technician**: `electrical-team`
- **Mechanical Manager / Mechanic**: `mechanical-team`
- **HSE / HSE Manager**: `hse-team`
- **Manager / Admin**: `management`, `all-departments`
- **All Users**: `general`

## Authentication

The WebSocket connection requires a valid JWT token passed as a query parameter. The server should:
1. Validate the token
2. Extract user information
3. Join appropriate channels based on role
4. Send initial online users list
5. Send message history for default channel