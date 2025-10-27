const express = require('express');
const passport = require('passport');
const { generateToken } = require('../utils/generateToken');
const { 
  register, 
  login,
  googleAuthMobile, // Mobile endpoint
  getProfile, 
  updateProfile 
} = require('../controllers/auth');
const { verifyToken, validateRegister, validateLogin } = require('../middlewares/authmiddlewares');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// NEW: Mobile Google Auth endpoint (for React Native, Flutter, etc.)
// Mobile apps handle Google Sign-In on client side and send the result to this endpoint
router.post('/google/mobile', googleAuthMobile);

// Web Google OAuth routes with improved error handling
router.get('/google',
  (req, res, next) => {
    console.log('=== Google OAuth Initiated ===');
    console.log('User Agent:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    console.log('Referer:', req.headers.referer);
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false,
    accessType: 'offline',
    prompt: 'consent'
  })
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('=== Google OAuth Callback Received ===');
    console.log('Query params:', req.query);
    console.log('Error param:', req.query.error);
    console.log('Code present:', !!req.query.code);
    
    // Handle user cancellation or errors
    if (req.query.error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('OAuth error, redirecting to:', `${frontendUrl}?error=${req.query.error}`);
      return res.redirect(`${frontendUrl}?error=${encodeURIComponent(req.query.error)}`);
    }
    
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=auth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
      console.log('=== OAuth Success ===');
      console.log('User:', req.user.email || req.user.googleId);
      
      const token = generateToken(req.user._id);
      
      const userData = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        displayName: req.user.displayName,
        photo: req.user.photo,
        role: req.user.role
      };
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Detect if request is from mobile
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /android|iphone|ipad|mobile/i.test(userAgent);
      
      console.log('User Agent:', userAgent);
      console.log('Is Mobile:', isMobile);
      console.log('Redirecting to:', `${frontendUrl}/auth/callback`);
      
      // Build redirect URL with token and user data
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}${isMobile ? '&mobile=true' : ''}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}?error=auth_processing_failed`);
    }
  }
);

// Token verification endpoint
router.get('/verify', verifyToken, (req, res) => {
  res.json({ 
    success: true,
    valid: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;