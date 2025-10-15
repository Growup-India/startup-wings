// models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    required: function () {
      return !this.googleId && !this.phoneNumber;
    }
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true, // Allow null values but enforce uniqueness when present
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address'
    ],
    required: function () {
      return !this.googleId && !this.phoneNumber;
    }
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
    required: function () {
      return !this.googleId && !this.phoneNumber;
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
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
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

// Index for sorting by recent users and faster queries
userSchema.index({ createdAt: -1 });
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ firebaseUid: 1 }); // NEW: Index for Firebase UID

// Ensure at least one authentication method is present
userSchema.pre('validate', function(next) {
  if (!this.email && !this.phoneNumber && !this.googleId) {
    next(new Error('At least one authentication method (email, phone, or Google) is required'));
  } else {
    next();
  }
});

// Hash password before saving (only if password is provided and modified)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
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
  return await bcrypt.compare(candidatePassword, this.password);
};

// Override toJSON to exclude password
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
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
    isPhoneVerified: this.isPhoneVerified,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    firebaseUid: this.firebaseUid // Include Firebase UID in public profile
  };
};

// Static method to find user by email or phone
userSchema.statics.findByEmailOrPhone = async function(identifier) {
  const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(identifier);
  const isPhone = /^\+[1-9]\d{1,14}$/.test(identifier);
  
  if (isEmail) {
    return await this.findOne({ email: identifier });
  } else if (isPhone) {
    return await this.findOne({ phoneNumber: identifier });
  }
  
  return null;
};

// NEW: Static method to find user by Firebase UID
userSchema.statics.findByFirebaseUid = async function(firebaseUid) {
  return await this.findOne({ firebaseUid });
};

// NEW: Static method to find or create user from Firebase auth
userSchema.statics.findOrCreateFromFirebase = async function(firebaseData) {
  const { uid, phoneNumber, displayName } = firebaseData;
  
  // Try to find existing user by Firebase UID
  let user = await this.findOne({ firebaseUid: uid });
  
  if (user) {
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    return { user, isNewUser: false };
  }
  
  // Try to find by phone number (in case user registered via phone before Firebase)
  user = await this.findOne({ phoneNumber });
  
  if (user) {
    // Link Firebase UID to existing user
    user.firebaseUid = uid;
    user.isPhoneVerified = true;
    user.lastLogin = new Date();
    await user.save();
    return { user, isNewUser: false };
  }
  
  // Create new user
  const userName = displayName || `User_${phoneNumber.slice(-4)}`;
  
  user = new this({
    phoneNumber,
    name: userName,
    firebaseUid: uid,
    isPhoneVerified: true,
    lastLogin: new Date()
  });
  
  await user.save();
  return { user, isNewUser: true };
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);