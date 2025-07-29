// This script tests the /api/auth/verify-otp endpoint.

const axios = require('axios');

async function testVerifyOtp() {
  // --- IMPORTANT: Replace with actual values for testing ---
  const emailToVerify = 'lccoy1@gmail.com'; // Replace with a valid email that has an OTP sent to it
  const otpToVerify = '711644'; // Replace with the actual OTP received
  // -------------------------------------------------------

  console.log(`Attempting to verify OTP for email: ${emailToVerify} with OTP: ${otpToVerify}`);

  try {
    const response = await axios.post('http://localhost:3000/api/auth/verify-otp', {
      email: emailToVerify,
      otp: otpToVerify,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;

    console.log('API Response:', result);

    if (result.success) {
      console.log('\n✅ OTP Verification Test successful!');
      console.log('User email should now be marked as verified in the database.');
    } else {
      console.log('\n❌ OTP Verification Test failed.');
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error: ${error.response?.status} ${error.response?.statusText}`);
      console.error('Response body:', error.response?.data);
    } else {
      console.error('An error occurred while running the OTP verification test script:', error);
    }
  }
}

testVerifyOtp();
