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
      return !this.googleId && !this.phoneNumber && !this.firebaseUid;
    }
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    unique: true,
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
    select: false,
    required: function () {
      return this.authProvider === 'local';
    }
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [
      /^\+[1-9]\d{1,14}$/,
      'Please enter a valid phone number in E.164 format (e.g., +919876543210)'
    ]
  },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  googleId: { type: String, unique: true, sparse: true },
  firebaseUid: { type: String, unique: true, sparse: true },
  displayName: String,
  photo: String,
  picture: String,
  avatar: String,
  profilePicture: String,
  bio: { type: String, maxlength: [500, 'Bio cannot exceed 500 characters'] },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'phone', 'firebase', 'email'],
    default: 'local'
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null }
}, {
  timestamps: true
});

// Keep only the non-duplicating indexes — unique:true already creates indexes for email/phone/googleId/firebaseUid
userSchema.index({ createdAt: -1 });
userSchema.index({ authProvider: 1 });
userSchema.index({ isActive: 1 });

// Validation, hooks, methods unchanged (kept but with .exec() in statics)
userSchema.pre('validate', function(next) {
  if (!this.email && !this.phoneNumber && !this.googleId && !this.firebaseUid) {
    next(new Error('At least one authentication method (email, phone, Google, or Firebase) is required'));
  } else {
    next();
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

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

// Statics - use exec() to ensure consistent Promise behavior
userSchema.statics.findByEmailOrPhone = async function(identifier) {
  if (!identifier) return null;
  const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(identifier);
  const isPhone = /^\+[1-9]\d{1,14}$/.test(identifier);
  if (isEmail) return await this.findOne({ email: identifier.toLowerCase().trim() }).exec();
  if (isPhone) return await this.findOne({ phoneNumber: identifier.trim() }).exec();
  return null;
};

userSchema.statics.findByEmailOrGoogleId = async function(email, googleId) {
  const query = {};
  if (email && googleId) query.$or = [{ email: email.toLowerCase().trim() }, { googleId }];
  else if (email) query.email = email.toLowerCase().trim();
  else if (googleId) query.googleId = googleId;
  else return null;
  return await this.findOne(query).exec();
};

userSchema.statics.findByFirebaseUid = async function(firebaseUid) {
  if (!firebaseUid) return null;
  return await this.findOne({ firebaseUid }).exec();
};

userSchema.statics.findOrCreateFromFirebase = async function(firebaseData) {
  const { uid, phoneNumber, displayName, email } = firebaseData;
  if (!uid) throw new Error('Firebase UID is required');

  let user = await this.findOne({ firebaseUid: uid }).exec();
  if (user) {
    user.lastLogin = new Date();
    if (phoneNumber) user.isPhoneVerified = true;
    if (email) user.isEmailVerified = true;
    await user.save();
    return { user, isNewUser: false };
  }

  if (phoneNumber) {
    user = await this.findOne({ phoneNumber }).exec();
    if (user) {
      user.firebaseUid = uid;
      user.isPhoneVerified = true;
      if (user.authProvider === 'local' || user.authProvider === 'phone') user.authProvider = 'firebase';
      user.lastLogin = new Date();
      await user.save();
      return { user, isNewUser: false };
    }
  }

  if (email) {
    user = await this.findOne({ email: email.toLowerCase().trim() }).exec();
    if (user) {
      user.firebaseUid = uid;
      user.isEmailVerified = true;
      if (phoneNumber) {
        user.phoneNumber = phoneNumber;
        user.isPhoneVerified = true;
      }
      if (user.authProvider === 'local') user.authProvider = 'firebase';
      user.lastLogin = new Date();
      await user.save();
      return { user, isNewUser: false };
    }
  }

  const userName = displayName || (email ? email.split('@')[0] : null) || (phoneNumber ? `User_${phoneNumber.slice(-4)}` : 'New User');
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

userSchema.methods.hasPassword = function() { return !!this.password; };
userSchema.methods.updateLastLogin = async function() { this.lastLogin = new Date(); return await this.save(); };
userSchema.methods.canLoginWithPassword = function() { return this.authProvider === 'local' && this.hasPassword(); };
userSchema.methods.getPhotoUrl = function() { return this.photo || this.picture || this.avatar || this.profilePicture || null; };

userSchema.statics.emailExists = async function(email) {
  if (!email) return false;
  const user = await this.findOne({ email: email.toLowerCase().trim() }).exec();
  return !!user;
};

userSchema.statics.phoneExists = async function(phoneNumber) {
  if (!phoneNumber) return false;
  const user = await this.findOne({ phoneNumber: phoneNumber.trim() }).exec();
  return !!user;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
