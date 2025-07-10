// test-endpoints.js
// Simple test script to verify our backend endpoints

const BASE_URL = 'http://localhost:3000/api';

async function testEndpoint(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`\n${method} ${endpoint}:`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', result);
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error testing ${method} ${endpoint}:`, error.message);
    return { status: 'ERROR', data: { error: error.message } };
  }
}

async function runTests() {
  console.log('🧪 Testing FlatFacts Backend Endpoints\n');

  // Test 1: Send OTP
  console.log('1. Testing Send OTP...');
  await testEndpoint('POST', '/send-otp', {
    email: 'test@example.com'
  });

  // Test 2: Verify OTP (this will fail without real OTP, but we can test the structure)
  console.log('\n2. Testing Verify OTP (will fail without real OTP)...');
  await testEndpoint('POST', '/verify-otp', {
    email: 'test@example.com',
    otp: '123456',
    password: 'testpassword123'
  });

  // Test 3: Onboarding (will fail without real UID, but we can test the structure)
  console.log('\n3. Testing Onboarding (will fail without real UID)...');
  await testEndpoint('POST', '/onboarding', {
    uid: 'fake-uid-123',
    username: 'testuser',
    avatar: 'avatar1'
  });

  // Test 4: Get User Profile (will fail without real UID, but we can test the structure)
  console.log('\n4. Testing Get User Profile (will fail without real UID)...');
  await testEndpoint('GET', '/user-profile?uid=fake-uid-123');

  console.log('\n✅ Endpoint testing complete!');
  console.log('\n📝 Notes:');
  console.log('- OTP verification will fail without a real OTP from the send-otp endpoint');
  console.log('- Onboarding and user profile will fail without real UIDs');
  console.log('- This is expected behavior for testing without real data');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}

module.exports = { testEndpoint, runTests }; 