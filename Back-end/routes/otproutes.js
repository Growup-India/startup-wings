const express = require('express');
const { sendMobileOTP, verifyMobileOTP, resendOTP } = require('../controllers/otp');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Rate limiting for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for verification attempts
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per window
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

// Validation middleware for OTP verification
const validateOTPVerification = [
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+91[6-9]\d{9}$/)
    .withMessage('Invalid phone number format'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
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

// Send OTP to mobile number
router.post(
  '/send',
  otpLimiter,
  validatePhoneNumber,
  handleValidationErrors,
  sendMobileOTP
);

// Verify OTP and login/register
router.post(
  '/verify',
  verifyLimiter,
  validateOTPVerification,
  handleValidationErrors,
  verifyMobileOTP
);

// Resend OTP
router.post(
  '/resend',
  otpLimiter,
  validatePhoneNumber,
  handleValidationErrors,
  resendOTP
);

// Health check endpoint for OTP service
router.get('/health', (req, res) => {
  const fast2smsConfigured = !!process.env.FAST2SMS_API_KEY;
  
  res.json({
    success: true,
    service: 'OTP Service',
    status: 'operational',
    smsProvider: fast2smsConfigured ? 'Fast2SMS' : 'Mock (Development)',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;