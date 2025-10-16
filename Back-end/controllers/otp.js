const User = require('../models/user');
const { generateToken } = require('../utils/generateToken');
// const { sendOTP } = require('../config/Fast2SMS');

// Store OTP session data temporarily (in production, use Redis)
const otpSessionStore = new Map();

// Send OTP to mobile number
const initiateMobileOTP = async (req, res) => {
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
      phoneNumber,
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

    if (!idToken || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'ID token and phone number are required' });
    }

    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }

    const { auth } = require('../config/Firebase');
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (err) {
      console.error('Firebase token verification error:', err);
      return res.status(401).json({ success: false, error: 'Invalid or expired token. Please try again.' });
    }

    if (decodedToken.phone_number !== phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number mismatch' });
    }

    otpSessionStore.delete(phoneNumber);

    let user = await User.findOne({ phoneNumber });
    let isNewUser = false;

    if (user) {
      user.lastLogin = new Date();
      user.isPhoneVerified = true;
      await user.save();
    } else {
      const userName = name || `User_${phoneNumber.slice(-4)}`;
      user = new User({
        phoneNumber,
        name: userName,
        isPhoneVerified: true,
        lastLogin: new Date(),
        firebaseUid: decodedToken.uid
      });
      await user.save();
      isNewUser = true;
    }

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
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'An account with this phone number already exists' });
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
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    const user = await User.findOne({ phoneNumber });
    res.json({ success: true, exists: !!user, isNewUser: !user });
  } catch (error) {
    console.error('Check phone number error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check phone number',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ✅ Export all three functions
module.exports = {
  initiateMobileOTP,
  verifyFirebaseToken,
  checkPhoneNumber
};
