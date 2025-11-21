// Routes/otproutes.js - Updated with JWT role support
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/user');
const { generateToken } = require('../utils/generateToken');
const rateLimit = require('express-rate-limit');

// Rate limiting for OTP endpoints
const otpInitiateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many OTP requests, please try again later.' }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'Too many verification attempts, please try again later.' }
});

// Health check
router.get('/health', (req, res) => {
  const firebaseConfigured = admin.apps.length > 0;
  res.json({
    success: true,
    firebase: firebaseConfigured ? 'Configured' : 'Not Configured',
    message: firebaseConfigured 
      ? 'OTP service is ready' 
      : 'Firebase Admin SDK not configured'
  });
});

// Initiate OTP session
router.post('/initiate', otpInitiateLimiter, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    console.log(`[OTP] Initiate session for: ${phoneNumber}`);

    res.json({
      success: true,
      message: 'OTP initiated successfully'
    });
  } catch (error) {
    console.error('[OTP] Initiate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate OTP session'
    });
  }
});

// Verify Firebase token and complete authentication
router.post('/verify', otpVerifyLimiter, async (req, res) => {
  try {
    const { idToken, phoneNumber, name } = req.body;

    if (!idToken || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'ID token and phone number are required'
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log(`[OTP] Token verified for: ${decodedToken.phone_number}`);
    } catch (verifyError) {
      console.error('[OTP] Token verification failed:', verifyError);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired OTP token'
      });
    }

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { phoneNumber: phoneNumber },
        { firebaseUid: decodedToken.uid }
      ]
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await User.create({
        name: name || `User_${phoneNumber.slice(-4)}`,
        phoneNumber: phoneNumber,
        firebaseUid: decodedToken.uid,
        authMethod: 'phone',
        role: 'user', // Default role for new users
        accountType: 'free'
      });
      isNewUser = true;
      console.log(`[OTP] New user created: ${phoneNumber} (${user.role})`);
    } else {
      // Update existing user
      user.firebaseUid = decodedToken.uid;
      if (!user.phoneNumber) {
        user.phoneNumber = phoneNumber;
      }
      await user.save();
      console.log(`[OTP] Existing user logged in: ${phoneNumber} (${user.role})`);
    }

    // Generate JWT token with user role
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      isNewUser,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        accountType: user.accountType
      }
    });
  } catch (error) {
    console.error('[OTP] Verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed. Please try again.'
    });
  }
});

// Check if phone number exists
router.post('/check', async (req, res) => {
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
    console.error('[OTP] Check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check phone number'
    });
  }
});

module.exports = router;