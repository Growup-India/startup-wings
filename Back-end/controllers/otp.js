// controllers/otp.js
const User = require('../models/user');
const { generateToken } = require('../utils/generateToken');
const { sendOTP } = require('../config/Fast2SMS');

// Store OTP session data temporarily (in production, use Redis)
const otpSessionStore = new Map();

// Send OTP to mobile numberw
const sendMobileOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate phone number format (Indian format)
    const phoneRegex = /^\+91 [6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid Indian phone number (e.g., +91 9876543210)'
      });
    }

    // Create a session for this phone number
    const sessionId = Date.now().toString();
    otpSessionStore.set(phoneNumber, {
      sessionId,
      createdAt: Date.now(),
      attempts: 0,
      verified: false
    });

    console.log(`📱 OTP session initiated for ${phoneNumber}`);

    return res.json({
      success: true,
      message: 'OTP session initiated. Please verify using Firebase on client side.',
      phoneNumber: phoneNumber,
      sessionId,
      method: 'firebase'
    });
  } catch (error) {
    console.error('Initiate OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate OTP. Please try again.',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Verify Firebase ID Token and login/register user
const verifyFirebaseToken = async (req, res) => {
  try {
    const { idToken, phoneNumber, name } = req.body;

    // Validate inputs
    if (!idToken || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'ID token and phone number are required'
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

    // Verify the Firebase ID token
    const { auth } = require('../config/Firebase');
    let decodedToken;
    
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Firebase token verification error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please try again.'
      });
    }

    // Verify phone number matches the token
    if (decodedToken.phone_number !== phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number mismatch'
      });
    }

    // Clear session from store
    otpSessionStore.delete(phoneNumber);

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    let isNewUser = false;

    if (user) {
      // Existing user - update last login
      user.lastLogin = new Date();
      user.isPhoneVerified = true;
      await user.save();
      
      console.log('Existing user logged in:', phoneNumber);
    } else {
      // New user - create account
      const userName = name || `User_${phoneNumber.slice(-4)}`;
      
      user = new User({
        phoneNumber,
        name: userName,
        isPhoneVerified: true,
        lastLogin: new Date(),
        firebaseUid: decodedToken.uid // Store Firebase UID
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
    console.error('Verify Firebase token error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'An account with this phone number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to verify token. Please try again.',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Check if phone number exists
const checkPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const user = await User.findOne({ phoneNumber });

    res.json({
      success: true,
      exists: !!user,
      isNewUser: !user
    });
  } catch (error) {
    console.error('Check phone number error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check phone number',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  initiateMobileOTP,
  verifyFirebaseToken,
  checkPhoneNumber
};