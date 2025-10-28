const User = require('../models/user');
const { generateToken } = require('../utils/generateToken');

// Register new user with email/password
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (existingUser) {
      // Check if user registered with different auth method
      if (existingUser.authProvider === 'google') {
        return res.status(400).json({
          success: false,
          error: 'Email already registered',
          message: 'This email is already registered using Google Sign-In. Please use Google to login.',
          authProvider: 'google'
        });
      }
      
      if (existingUser.authProvider === 'firebase' || existingUser.authProvider === 'phone') {
        return res.status(400).json({
          success: false,
          error: 'Email already registered',
          message: 'This email is already registered using Phone Authentication. Please use phone login.',
          authProvider: existingUser.authProvider
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
        message: 'An account with this email already exists. Please login instead.'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password, // Will be hashed by pre-save middleware
      authProvider: 'local',
      isActive: true,
      isEmailVerified: false
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        messages
      });
    }

    // Handle duplicate key error (shouldn't happen due to check above, but just in case)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        error: 'Duplicate entry',
        message: `${field === 'email' ? 'Email' : field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to register user. Please try again.'
    });
  }
};

// Login user with email/password
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email and include password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if user registered with email/password
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        error: 'Wrong authentication method',
        message: 'This account was registered using Google Sign-In. Please use Google to login.',
        authProvider: 'google'
      });
    }

    if (user.authProvider === 'firebase' || user.authProvider === 'phone') {
      return res.status(400).json({
        success: false,
        error: 'Wrong authentication method',
        message: 'This account was registered using Phone Authentication. Please use phone login.',
        authProvider: user.authProvider
      });
    }

    // Verify password exists (for users who might have been migrated)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'No password set',
        message: 'This account does not have a password. Please use the authentication method you originally registered with.'
      });
    }

    // Compare password using the model method
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to login. Please try again.'
    });
  }
};

// Google OAuth Mobile endpoint
const googleAuthMobile = async (req, res) => {
  try {
    const { idToken, email, name, photo, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and Google ID are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { googleId }
      ]
    });

    if (user) {
      // Update existing user
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      
      if (photo && !user.photo) {
        user.photo = photo;
      }
      
      if (!user.displayName && name) {
        user.displayName = name;
      }
      
      // Update auth provider if user was registered with email/password
      if (user.authProvider === 'local' && user.googleId) {
        user.authProvider = 'google';
      }
      
      user.isEmailVerified = true;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = new User({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        googleId,
        photo,
        displayName: name,
        authProvider: 'google',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date()
      });
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Google mobile auth error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Account conflict',
        message: 'An account with this email or Google ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Failed to authenticate with Google'
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account deactivated'
      });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, displayName, bio, photo } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (photo !== undefined) updateData.photo = photo;

    const user = await User.findByIdAndUpdate(
      req.user.id,
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
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        messages
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

module.exports = {
  register,
  login,
  googleAuthMobile,
  getProfile,
  updateProfile
};