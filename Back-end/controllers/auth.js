const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generateToken } = require('../utils/generateToken');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    console.log('Checking for existing user with email:', normalizedEmail);
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (existingUser) {
      console.log('User already exists with email:', normalizedEmail);
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email address'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    await user.save();
    console.log('User created successfully:', normalizedEmail);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle specific MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email address'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Google OAuth Login - Find or Create User
const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, displayName, photo } = req.body;

    // Input validation
    if (!googleId) {
      return res.status(400).json({
        success: false,
        error: 'Google ID is required'
      });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    // Try to find user by googleId first
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, update last login and return
      console.log('Existing Google user found:', user.email);
      user.lastLogin = new Date();
      
      // Optionally update profile info if changed
      if (displayName && user.displayName !== displayName) {
        user.displayName = displayName;
      }
      if (photo && user.photo !== photo) {
        user.photo = photo;
      }
      
      await user.save();
    } else {
      // User doesn't exist by googleId, check if email exists
      if (normalizedEmail) {
        user = await User.findOne({ email: normalizedEmail });
        
        if (user) {
          // Link Google account to existing user
          console.log('Linking Google account to existing user:', normalizedEmail);
          user.googleId = googleId;
          user.displayName = displayName || user.displayName;
          user.photo = photo || user.photo;
          user.lastLogin = new Date();
          await user.save();
        } else {
          // Create new user with email
          console.log('Creating new Google user with email:', normalizedEmail);
          user = new User({
            googleId,
            email: normalizedEmail,
            name: name || displayName || 'Google User',
            displayName,
            photo,
            lastLogin: new Date()
          });
          
          await user.save();
        }
      } else {
        // No email provided, create user with only googleId
        console.log('Creating new Google user without email');
        user = new User({
          googleId,
          name: name || displayName || 'Google User',
          displayName,
          photo,
          lastLogin: new Date()
        });
        
        await user.save();
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        displayName: user.displayName,
        photo: user.photo,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      // Check if it's a duplicate email or googleId
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({
          success: false,
          error: 'An account with this email already exists. Please try logging in normally or contact support.'
        });
      } else if (error.keyPattern && error.keyPattern.googleId) {
        return res.status(400).json({
          success: false,
          error: 'This Google account is already registered. Please try again.'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Account linking failed. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Google authentication failed. Please try again.',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        displayName: user.displayName,
        photo: user.photo,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ 
        email: normalizedEmail,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email is already taken by another user'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email is already taken by another user'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  getProfile,
  updateProfile
};