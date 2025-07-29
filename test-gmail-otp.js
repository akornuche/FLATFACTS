// This script tests the /api/send-otp endpoint.

const axios = require('axios');

async function testSendOtp() {
  // --- IMPORTANT: Change this to the email address where you want to receive the test OTP ---
  const recipientEmail = 'lccoy1@gmail.com';
  const testPassword = '1adfd!234AS'; // Add a test password
  // ------------------------------------------------------------------------------------

  console.log(`Attempting to send OTP to: ${recipientEmail}`);

  try {
    const response = await axios.post('http://localhost:3000/api/send-otp', {
      email: recipientEmail,
      password: testPassword, // Include password in the request
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;

    console.log('API Response:', result);

    if (result.success) {
      console.log('\n✅ Test successful! The API returned a success message.');
      console.log(`Check the inbox of ${recipientEmail} for an OTP code.`);
    } else {
      console.log('\n❌ Test failed. The API did not return a success message.');
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error: ${error.response?.status} ${error.response?.statusText}`);
      console.error('Response body:', error.response?.data);
    } else {
      console.error('An error occurred while running the test script:', error);
    }
  }
}

testSendOtp();
