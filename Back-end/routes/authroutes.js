const express = require('express');
const passport = require('passport');
const { generateToken } = require('../utils/generateToken');
const { 
  register, 
  login, 
  getProfile, 
  updateProfile 
} = require('../controllers/auth');
const { verifyToken, validateRegister, validateLogin } = require('../middlewares/authmiddlewares');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// FIXED: Google OAuth routes with proper error handling
router.get('/google',
  (req, res, next) => {
    console.log('=== Google OAuth Initiated ===');
    console.log('User Agent:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false,
    accessType: 'offline',
    prompt: 'consent' // ADDED: Force account selection
  })
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('=== Google OAuth Callback Received ===');
    console.log('Query params:', req.query);
    console.log('Error param:', req.query.error);
    
    // Handle user cancellation
    if (req.query.error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}?error=auth_cancelled`);
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
      console.log('User:', req.user.email);
      
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
      
      // FIXED: Better mobile detection and redirect
      const isMobile = /mobile|android|iphone|ipad|phone/i.test(req.headers['user-agent']);
      
      if (isMobile) {
        // For mobile, use a custom scheme or universal link
        // Example: myapp://auth/callback?token=...
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}&mobile=true`);
      } else {
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=auth_failed`);
    }
  }
);

// ADDED: Alternative endpoint for mobile deep linking
router.get('/google/mobile',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false,
    accessType: 'offline',
    prompt: 'consent'
  })
);

// Token verification endpoint
router.get('/verify', verifyToken, (req, res) => {
  res.json({ 
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