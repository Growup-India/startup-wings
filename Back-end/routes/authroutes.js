// Routes/authroutes.js - Hardened: DB guards, exec(), safe selects
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user');
const { generateToken } = require('../utils/generateToken');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

// DB guard middleware (local helper)
const ensureDbConnected = (req, res, next) => {
  // 1 = connected
  if (mongoose.connection.readyState === 1) return next();
  console.warn('[ensureDbConnected] Rejecting auth request - DB state:', mongoose.connection.readyState, req.method, req.path);
  return res.status(503).json({ success: false, message: 'Service Unavailable - database not connected' });
};

// User Registration
router.post('/register', authLimiter, ensureDbConnected, async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists (use exec and handle DB errors)
    let existingUser;
    try {
      existingUser = await User.findOne({ email: normalizedEmail }).exec();
    } catch (dbErr) {
      console.error('[AUTH] Registration DB error during findOne:', dbErr);
      return res.status(503).json({ success: false, message: 'Service Unavailable - database error' });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (use create() which wraps save)
    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user', // Default role
        accountType: 'free'
      });
    } catch (createErr) {
      console.error('[AUTH] Registration DB error during create:', createErr);
      // handle common mongoose errors
      if (createErr.name === 'ValidationError') {
        const messages = Object.values(createErr.errors).map(e => e.message);
        return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
      }
      if (createErr.code === 11000) {
        return res.status(400).json({ success: false, message: 'Duplicate entry' });
      }
      return res.status(503).json({ success: false, message: 'Service Unavailable - database error' });
    }

    // Generate JWT token with user role
    const token = generateToken(user._id, user.role);

    console.log(`[AUTH] New user registered: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType
      }
    });
  } catch (error) {
    console.error('[AUTH] Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.', error: error.message });
  }
});

// User Login
router.post('/login', authLimiter, ensureDbConnected, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user and select password explicitly (schema has select:false)
    let user;
    try {
      user = await User.findOne({ email: normalizedEmail }).select('+password').exec();
    } catch (dbErr) {
      console.error('[AUTH] Login DB error during findOne:', dbErr);
      return res.status(503).json({ success: false, message: 'Service Unavailable - database error' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password (ensure password exists)
    if (!user.password) {
      console.warn('[AUTH] Login - user has no password set:', user._id);
      return res.status(400).json({ success: false, message: 'Account has no password. Use original auth method.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT token with user role
    const token = generateToken(user._id, user.role);

    console.log(`[AUTH] User logged in: ${user.email} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        photo: user.photo || user.picture
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.', error: error.message });
  }
});

// Verify Token (optional - for client-side verification)
router.get('/verify', ensureDbConnected, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const { verifyToken } = require('../utils/generateToken');
    const decoded = verifyToken(token);
    
    let user;
    try {
      user = await User.findById(decoded.id).select('-password').exec();
    } catch (dbErr) {
      console.error('[AUTH] Verify DB error during findById:', dbErr);
      return res.status(503).json({ success: false, message: 'Service Unavailable - database error' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType
      }
    });
  } catch (error) {
    console.error('[AUTH] Token verification error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
