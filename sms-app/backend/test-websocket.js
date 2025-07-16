const io = require('socket.io-client');

// Test WebSocket connection
const testWebSocket = async () => {
  console.log('🔌 Testing WebSocket connection...');
  
  // Replace with a valid JWT token from your auth system
  const token = 'YOUR_JWT_TOKEN_HERE';
  
  const socket = io('http://localhost:3005', {
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
    console.log('Socket ID:', socket.id);
    
    // Test sending a message
    socket.emit('message:send', {
      channelId: 1,
      content: 'Hello from test client!',
      messageType: 'text'
    });
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  socket.on('message:new', (message) => {
    console.log('📨 New message received:', message);
  });

  socket.on('typing:user', (data) => {
    console.log(`✏️ ${data.userName} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
  });

  socket.on('presence:update', (data) => {
    console.log(`👤 ${data.userName} is ${data.isOnline ? 'online' : 'offline'}`);
  });

  // Test typing indicator
  setTimeout(() => {
    socket.emit('typing:start', {
      channelId: 1,
      isTyping: true
    });
  }, 2000);

  setTimeout(() => {
    socket.emit('typing:stop', {
      channelId: 1,
      isTyping: false
    });
  }, 4000);

  // Keep connection alive for testing
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 10000);
};

// Instructions for testing
console.log(`
=== WebSocket Test Client ===

To test the WebSocket server:

1. First, get a valid JWT token by logging in:
   curl -X POST http://localhost:3005/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email": "john.doe@oceanic.com", "password": "password123"}'

2. Copy the accessToken from the response

3. Edit this file and replace 'YOUR_JWT_TOKEN_HERE' with the actual token

4. Run this test:
   node test-websocket.js

The test will:
- Connect to the WebSocket server
- Send a test message
- Send typing indicators
- Listen for events
- Disconnect after 10 seconds
`);

// Uncomment to run the test
// testWebSocket();