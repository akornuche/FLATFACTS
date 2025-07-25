// This script tests the /api/send-otp endpoint.

async function testSendOtp() {
  // --- IMPORTANT: Change this to the email address where you want to receive the test OTP ---
  const recipientEmail = 'a3isalink@gmail.com';
  // ------------------------------------------------------------------------------------

  console.log(`Attempting to send OTP to: ${recipientEmail}`);

  try {
    const response = await fetch('http://localhost:3000/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: recipientEmail }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      console.error('Response body:', result);
      return;
    }

    console.log('API Response:', result);

    if (result.success) {
      console.log('\n✅ Test successful! The API returned a success message.');
      console.log(`Check the inbox of ${recipientEmail} for an OTP code.`);
    } else {
      console.log('\n❌ Test failed. The API did not return a success message.');
    }

  } catch (error) {
    console.error('An error occurred while running the test script:', error);
  }
}

testSendOtp();
