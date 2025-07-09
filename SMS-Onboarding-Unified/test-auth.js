#!/usr/bin/env node

// Test authentication flow with the backend
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Demo users from backend config
const demoUsers = [
  { email: 'admin@demo.com', password: 'Demo123!', role: 'ADMIN' },
  { email: 'manager@demo.com', password: 'Demo123!', role: 'MANAGER' },
  { email: 'tech@demo.com', password: 'Demo123!', role: 'TECHNICIAN' },
  { email: 'hse@demo.com', password: 'Demo123!', role: 'HSE_OFFICER' },
];

async function testLogin(user) {
  console.log(`\n=== Testing login for ${user.role} (${user.email}) ===`);
  
  try {
    // Test login
    console.log('1. Testing login endpoint...');
    const loginResponse = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
      email: user.email,
      password: user.password,
      rememberMe: true
    });
    
    console.log('✅ Login successful!');
    console.log('   Token:', loginResponse.data.token.substring(0, 20) + '...');
    console.log('   User:', loginResponse.data.user);
    
    // Test get current user
    console.log('\n2. Testing /me endpoint...');
    const meResponse = await axios.get(`${API_BASE_URL}/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('✅ Get current user successful!');
    console.log('   User data:', meResponse.data);
    
    // Test token refresh
    console.log('\n3. Testing token refresh...');
    const refreshResponse = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
      refreshToken: loginResponse.data.refreshToken
    });
    
    console.log('✅ Token refresh successful!');
    console.log('   New token:', refreshResponse.data.token.substring(0, 20) + '...');
    
    // Test logout
    console.log('\n4. Testing logout...');
    await axios.post(`${API_BASE_URL}/v1/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${refreshResponse.data.token}`
      }
    });
    
    console.log('✅ Logout successful!');
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function testAll() {
  console.log('Starting authentication tests...');
  console.log('API URL:', API_BASE_URL);
  console.log('Demo mode should be enabled in backend .env');
  
  // Test if backend is running
  try {
    await axios.get(`${API_BASE_URL}/health`);
  } catch (error) {
    console.error('\n❌ Backend is not running on', API_BASE_URL);
    console.error('Please start the backend server first:');
    console.error('  cd backend && npm install && npm run dev');
    process.exit(1);
  }
  
  // Test each demo user
  for (const user of demoUsers) {
    await testLogin(user);
  }
  
  console.log('\n=== All tests completed ===');
}

// Check if axios is available
try {
  require.resolve('axios');
} catch (e) {
  console.error('axios is not installed. Installing...');
  require('child_process').execSync('npm install axios', { stdio: 'inherit' });
}

testAll().catch(console.error);