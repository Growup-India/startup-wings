const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    required: function () {
      return !this.googleId && !this.phoneNumber && !this.firebaseUid;
    }
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true, // Allow null values but enforce uniqueness when present
    unique: true, // Add unique constraint
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address'
    ],
    required: function () {
      return this.authProvider === 'local' || (this.authProvider === 'google' && !this.googleId);
    }
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
    required: function () {
      return this.authProvider === 'local';
    }
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but enforce uniqueness when present
    trim: true,
    match: [
      /^\+[1-9]\d{1,14}$/,
      'Please enter a valid phone number in E.164 format (e.g., +919876543210)'
    ]
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Store Firebase UID for phone auth users
  },
  displayName: String,
  photo: String,
  picture: String, // For Google OAuth
  avatar: String,
  profilePicture: String,
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'phone', 'firebase', 'email'],
    default: 'local'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
userSchema.index({ createdAt: -1 });
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ authProvider: 1 });
userSchema.index({ isActive: 1 });

// Ensure at least one authentication method is present
userSchema.pre('validate', function(next) {
  if (!this.email && !this.phoneNumber && !this.googleId && !this.firebaseUid) {
    next(new Error('At least one authentication method (email, phone, Google, or Firebase) is required'));
  } else {
    next();
  }
});

// Hash password before saving (only if password is provided and modified)
userSchema.pre('save', async function(next) {
  // Skip if password is not modified or not present
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Override toJSON to exclude password and sensitive fields
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phoneNumber: this.phoneNumber,
    role: this.role,
    photo: this.photo || this.picture || this.avatar || this.profilePicture,
    displayName: this.displayName,
    bio: this.bio,
    isPhoneVerified: this.isPhoneVerified,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    authProvider: this.authProvider
  };
};

// Method to get safe user object (for auth responses)
userSchema.methods.toSafeObject = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phoneNumber: this.phoneNumber,
    displayName: this.displayName,
    photo: this.photo || this.picture || this.avatar || this.profilePicture,
    role: this.role,
    authProvider: this.authProvider,
    isPhoneVerified: this.isPhoneVerified,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin
  };
};

// Static method to find user by email or phone
userSchema.statics.findByEmailOrPhone = async function(identifier) {
  if (!identifier) return null;
  
  const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(identifier);
  const isPhone = /^\+[1-9]\d{1,14}$/.test(identifier);
  
  if (isEmail) {
    return await this.findOne({ email: identifier.toLowerCase().trim() });
  } else if (isPhone) {
    return await this.findOne({ phoneNumber: identifier.trim() });
  }
  
  return null;
};

// Static method to find by email or googleId
userSchema.statics.findByEmailOrGoogleId = async function(email, googleId) {
  const query = {};
  
  if (email && googleId) {
    query.$or = [{ email: email.toLowerCase().trim() }, { googleId }];
  } else if (email) {
    query.email = email.toLowerCase().trim();
  } else if (googleId) {
    query.googleId = googleId;
  } else {
    return null;
  }
  
  return this.findOne(query);
};

// Static method to find user by Firebase UID
userSchema.statics.findByFirebaseUid = async function(firebaseUid) {
  if (!firebaseUid) return null;
  return await this.findOne({ firebaseUid });
};

// Static method to find or create user from Firebase auth
userSchema.statics.findOrCreateFromFirebase = async function(firebaseData) {
  const { uid, phoneNumber, displayName, email } = firebaseData;
  
  if (!uid) {
    throw new Error('Firebase UID is required');
  }
  
  // Try to find existing user by Firebase UID
  let user = await this.findOne({ firebaseUid: uid });
  
  if (user) {
    // Update last login and verification status
    user.lastLogin = new Date();
    if (phoneNumber) user.isPhoneVerified = true;
    if (email) user.isEmailVerified = true;
    await user.save();
    return { user, isNewUser: false };
  }
  
  // Try to find by phone number (in case user registered via phone before Firebase)
  if (phoneNumber) {
    user = await this.findOne({ phoneNumber });
    
    if (user) {
      // Link Firebase UID to existing user
      user.firebaseUid = uid;
      user.isPhoneVerified = true;
      if (user.authProvider === 'local' || user.authProvider === 'phone') {
        user.authProvider = 'firebase';
      }
      user.lastLogin = new Date();
      await user.save();
      return { user, isNewUser: false };
    }
  }
  
  // Try to find by email (in case user registered via email before Firebase)
  if (email) {
    user = await this.findOne({ email: email.toLowerCase().trim() });
    
    if (user) {
      // Link Firebase UID to existing user
      user.firebaseUid = uid;
      user.isEmailVerified = true;
      if (phoneNumber) {
        user.phoneNumber = phoneNumber;
        user.isPhoneVerified = true;
      }
      if (user.authProvider === 'local') {
        user.authProvider = 'firebase';
      }
      user.lastLogin = new Date();
      await user.save();
      return { user, isNewUser: false };
    }
  }
  
  // Create new user
  const userName = displayName || 
                   (email ? email.split('@')[0] : null) ||
                   (phoneNumber ? `User_${phoneNumber.slice(-4)}` : 'New User');
  
  const userData = {
    firebaseUid: uid,
    name: userName,
    displayName: displayName || userName,
    authProvider: 'firebase',
    lastLogin: new Date()
  };
  
  if (phoneNumber) {
    userData.phoneNumber = phoneNumber;
    userData.isPhoneVerified = true;
  }
  
  if (email) {
    userData.email = email.toLowerCase().trim();
    userData.isEmailVerified = true;
  }
  
  user = new this(userData);
  await user.save();
  
  return { user, isNewUser: true };
};

// Instance method to check if user has a password
userSchema.methods.hasPassword = function() {
  return !!this.password;
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

// Method to check if user can login with email/password
userSchema.methods.canLoginWithPassword = function() {
  return this.authProvider === 'local' && this.hasPassword();
};

// Method to get primary photo URL
userSchema.methods.getPhotoUrl = function() {
  return this.photo || this.picture || this.avatar || this.profilePicture || null;
};

// Static method to check if email exists
userSchema.statics.emailExists = async function(email) {
  if (!email) return false;
  const user = await this.findOne({ email: email.toLowerCase().trim() });
  return !!user;
};

// Static method to check if phone exists
userSchema.statics.phoneExists = async function(phoneNumber) {
  if (!phoneNumber) return false;
  const user = await this.findOne({ phoneNumber: phoneNumber.trim() });
  return !!user;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);