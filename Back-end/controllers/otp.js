const User = require('../models/user');
const { generateToken } = require('../utils/generateToken');
const { sendOTP } = require('../config/Fast2SMS');

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Send OTP to mobile numberw
const sendMobileOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate phone number format (Indian format)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid Indian phone number (e.g., +919876543210)'
      });
    }

    // Check if using Fast2SMS or fallback to mock OTP
    const useFast2SMS = process.env.FAST2SMS_API_KEY;

    if (useFast2SMS) {
      try {
        // Use Fast2SMS to send OTP
        const result = await sendOTP(phoneNumber);
        
        // Store OTP with 5 minute expiry
        otpStore.set(phoneNumber, {
          otp: result.otp,
          expiresAt: Date.now() + 5 * 60 * 1000,
          attempts: 0
        });

        console.log(`📱 Fast2SMS OTP sent to ${phoneNumber}: ${result.otp}`);

        return res.json({
          success: true,
          message: 'OTP sent successfully to your mobile number',
          phoneNumber: phoneNumber,
          method: 'fast2sms',
          // Send OTP in development only
          ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
        });
      } catch (error) {
        console.error('Fast2SMS error:', error);
        // Fallback to mock OTP if Fast2SMS fails
        const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
        
        otpStore.set(phoneNumber, {
          otp: mockOTP,
          expiresAt: Date.now() + 5 * 60 * 1000,
          attempts: 0
        });

        console.log(`📱 Fallback Mock OTP for ${phoneNumber}: ${mockOTP}`);

        return res.json({
          success: true,
          message: 'OTP sent successfully (Fast2SMS unavailable, using mock)',
          phoneNumber: phoneNumber,
          method: 'mock-fallback',
          ...(process.env.NODE_ENV === 'development' && { otp: mockOTP })
        });
      }
    } else {
      // Mock OTP for development (when Fast2SMS is not configured)
      const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with 5 minute expiry
      otpStore.set(phoneNumber, {
        otp: mockOTP,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0
      });

      console.log(`📱 Mock OTP for ${phoneNumber}: ${mockOTP}`);

      return res.json({
        success: true,
        message: 'OTP sent successfully (Development Mode)',
        phoneNumber: phoneNumber,
        method: 'mock',
        // Only send OTP in development
        ...(process.env.NODE_ENV === 'development' && { otp: mockOTP })
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP. Please try again.',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Verify OTP and login/register user
const verifyMobileOTP = async (req, res) => {
  try {
    const { phoneNumber, otp, name } = req.body;

    // Validate inputs
    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP are required'
      });
    }

    // Validate phone number format
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Verify OTP from store
    const storedData = otpStore.get(phoneNumber);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'OTP expired or not found. Please request a new OTP.'
      });
    }

    // Check expiry
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        error: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      otpStore.set(phoneNumber, storedData);
      
      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
      });
    }

    // OTP is valid - clear it from store
    otpStore.delete(phoneNumber);

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    let isNewUser = false;

    if (user) {
      // Existing user - update last login
      user.lastLogin = new Date();
      await user.save();
      
      console.log('Existing user logged in:', phoneNumber);
    } else {
      // New user - create account
      const userName = name || `User_${phoneNumber.slice(-4)}`;
      
      user = new User({
        phoneNumber,
        name: userName,
        isPhoneVerified: true,
        lastLogin: new Date()
      });

      await user.save();
      isNewUser = true;
      console.log('New user created:', phoneNumber);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'An account with this phone number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP. Please try again.',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Call sendMobileOTP logic
    return sendMobileOTP(req, res);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend OTP',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  sendMobileOTP,
  verifyMobileOTP,
  resendOTP
};