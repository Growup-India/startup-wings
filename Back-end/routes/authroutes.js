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

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=auth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
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
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=auth_failed`);
    }
  }
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