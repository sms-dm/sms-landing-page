const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Test file upload for both portals
async function testFileUpload() {
  // Create a test file
  const testFilePath = path.join(__dirname, 'test-document.txt');
  fs.writeFileSync(testFilePath, 'This is a test document for SMS file upload system.');

  console.log('🧪 Testing file upload functionality...\n');

  // Test 1: Maintenance Portal
  try {
    console.log('1️⃣ Testing Maintenance Portal file upload...');
    
    // First, login to get token
    const loginRes = await axios.post('http://localhost:3005/api/auth/login', {
      email: 'john.doe@oceanic.com',
      password: 'password123'
    });
    
    const token = loginRes.data.accessToken;
    console.log('✅ Logged in successfully');

    // Upload file
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('document_type', 'manual');
    form.append('description', 'Test manual upload');

    const uploadRes = await axios.post(
      'http://localhost:3005/api/files/equipment/1/upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ File uploaded successfully:', uploadRes.data);

    // Test download
    const downloadRes = await axios.get(
      `http://localhost:3005/api/files/download/${uploadRes.data.id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ File download successful\n');

  } catch (error) {
    console.error('❌ Maintenance Portal test failed:', error.response?.data || error.message);
  }

  // Test 2: Onboarding Portal
  try {
    console.log('2️⃣ Testing Onboarding Portal file upload...');
    
    // First, login to get token
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'tech@demo.com',
      password: 'Demo123!'
    });
    
    const token = loginRes.data.accessToken;
    console.log('✅ Logged in successfully');

    // Get an equipment ID (you'll need to adjust this based on actual data)
    const equipmentId = 'sample-equipment-id'; // Replace with actual equipment ID

    // Upload file
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('documentType', 'manual');
    form.append('description', 'Test manual upload');

    const uploadRes = await axios.post(
      `http://localhost:3000/api/files/equipment/${equipmentId}/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ File uploaded successfully:', uploadRes.data);

    // Test download
    const downloadRes = await axios.get(
      `http://localhost:3000/api/files/download/${uploadRes.data.document.id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ File download successful');
    console.log('📄 Download URL:', downloadRes.data.url);

  } catch (error) {
    console.error('❌ Onboarding Portal test failed:', error.response?.data || error.message);
  }

  // Cleanup
  fs.unlinkSync(testFilePath);
  console.log('\n✨ File upload tests completed');
}

// Run tests
testFileUpload().catch(console.error);