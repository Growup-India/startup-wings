const axios = require('axios');

const fast2smsApiKey = process.env.FAST2SMS_API_KEY;

const sendOTP = async (phoneNumber) => {
  try {
    if (!fast2smsApiKey) {
      throw new Error('Fast2SMS not configured');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove country code if present (Fast2SMS works with 10-digit Indian numbers)
    const cleanNumber = phoneNumber.replace(/^\+91/, '');

    // Send OTP via Fast2SMS
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        variables_values: otp,
        route: 'otp',
        numbers: cleanNumber
      },
      {
        headers: {
          'authorization': fast2smsApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.return === true) {
      return {
        success: true,
        otp: otp, // Return OTP to store it
        message: 'OTP sent successfully'
      };
    } else {
      throw new Error('Failed to send OTP via Fast2SMS');
    }
  } catch (error) {
    console.error('Fast2SMS send OTP error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP');
  }
};

const sendCustomOTP = async (phoneNumber, otp, message) => {
  try {
    if (!fast2smsApiKey) {
      throw new Error('Fast2SMS not configured');
    }

    const cleanNumber = phoneNumber.replace(/^\+91/, '');

    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        sender_id: 'FSTSMS',
        message: message || `Your OTP is ${otp}. Valid for 5 minutes.`,
        language: 'english',
        route: 'q',
        numbers: cleanNumber
      },
      {
        headers: {
          'authorization': fast2smsApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: response.data.return === true,
      messageId: response.data.message_id
    };
  } catch (error) {
    console.error('Fast2SMS custom OTP error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP');
  }
};

module.exports = {
  sendOTP,
  sendCustomOTP
};