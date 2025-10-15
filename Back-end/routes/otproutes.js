// routes/otp.js
const express = require('express');
const { initiateMobileOTP, verifyFirebaseToken, checkPhoneNumber } = require('../controllers/otp');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Rate limiting for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window (increased for Firebase)
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for verification attempts
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 verification attempts per window
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware for phone number
const validatePhoneNumber = [
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number (e.g., +919876543210)'),
];

// Validation middleware for Firebase token verification
const validateFirebaseVerification = [
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Invalid phone number format'),
  body('idToken')
    .trim()
    .notEmpty()
    .withMessage('Firebase ID token is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

// Initiate OTP session (Firebase will handle actual OTP sending on client)
router.post(
  '/initiate',
  otpLimiter,
  validatePhoneNumber,
  handleValidationErrors,
  initiateMobileOTP
);

// Verify Firebase ID token and login/register
router.post(
  '/verify',
  verifyLimiter,
  validateFirebaseVerification,
  handleValidationErrors,
  verifyFirebaseToken
);

// Check if phone number exists
router.post(
  '/check',
  otpLimiter,
  validatePhoneNumber,
  handleValidationErrors,
  checkPhoneNumber
);

// Health check endpoint for OTP service
router.get('/health', (req, res) => {
  const firebaseConfigured = process.env.FIREBASE_PROJECT_ID ? true : false;
  
  res.json({
    success: true,
    service: 'OTP Service',
    status: 'operational',
    provider: 'Firebase Authentication',
    configured: firebaseConfigured,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;