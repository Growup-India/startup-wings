// routes/otp.js
const express = require('express');
const { sendMobileOTP, verifyFirebaseToken, checkPhoneNumber } = require('../controllers/otp');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again after 15 minutes.'
  },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again after 15 minutes.'
  },
});

const validatePhoneNumber = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+91[6-9]\d{9}$/).withMessage('Please enter a valid Indian mobile number (e.g., +919876543210)'),
];

const validateFirebaseVerification = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+91[6-9]\d{9}$/).withMessage('Invalid phone number format'),
  body('idToken')
    .trim()
    .notEmpty().withMessage('Firebase ID token is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

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

// ✅ Correct route bindings
router.post('/initiate', otpLimiter, validatePhoneNumber, handleValidationErrors, sendMobileOTP);
router.post('/verify', verifyLimiter, validateFirebaseVerification, handleValidationErrors, verifyFirebaseToken);
router.post('/check', otpLimiter, validatePhoneNumber, handleValidationErrors, checkPhoneNumber);

router.get('/health', (req, res) => {
  const firebaseConfigured = !!process.env.FIREBASE_PROJECT_ID;
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
