const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('=== Google Strategy Callback ===');
        console.log('Profile ID:', profile.id);
        console.log('Email:', profile.emails?.[0]?.value);
        console.log('Callback URL used:', getCallbackURL());

        // Extract user info from Google profile
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName || profile.name?.givenName || email?.split('@')[0];
        const photo = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // Find user by email or Google ID
        let user = await User.findOne({
          $or: [
            { email: email.toLowerCase() },
            { googleId: googleId }
          ]
        });

        if (user) {
          // Update existing user
          console.log('Existing user found:', user.email);
          
          // Update Google ID if not set
          if (!user.googleId) {
            user.googleId = googleId;
          }
          
          // Update photo if not set or if Google photo is available
          if (photo && (!user.photo || user.photo.includes('googleusercontent'))) {
            user.photo = photo;
          }
          
          // Mark as verified via Google
          user.emailVerified = true;
          user.lastLogin = Date.now();
          
          // If user was created with email/password, update auth provider
          if (user.authProvider === 'email' && user.googleId) {
            user.authProvider = 'google';
          }
          
          await user.save();
        } else {
          // Create new user
          console.log('Creating new user for:', email);
          
          user = new User({
            name,
            email: email.toLowerCase(),
            googleId,
            photo,
            displayName: profile.displayName,
            authProvider: 'google',
            isActive: true,
            emailVerified: true,
            lastLogin: Date.now()
          });
          
          await user.save();
          console.log('New user created:', user._id);
        }

        return done(null, user);
      } catch (error) {
        console.error('Google Strategy Error:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session (if using sessions)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session (if using sessions)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;