const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

// Serialize user for session (even though we're using JWT, this is still needed)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Dynamic callback URL based on environment
const getCallbackURL = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production URL - Replace with your actual domain
    return `${process.env.BACKEND_URL || 'https://startupwing.in'}/auth/google/callback`;
  }
  // Development URL
  return 'http://localhost:5000/auth/google/callback';
};

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL(),
      proxy: true, // Important for production behind reverse proxy
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('=== Google Strategy Callback ===');
        console.log('Profile ID:', profile.id);
        console.log('Email:', profile.emails?.[0]?.value);
        console.log('Callback URL used:', getCallbackURL());

        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName || profile.name?.givenName || 'User';
        const photo = profile.photos?.[0]?.value;

        if (!googleId) {
          return done(new Error('Google ID not found'), null);
        }

        // Try to find user by googleId first
        let user = await User.findOne({ googleId });

        if (user) {
          // Update last login and profile info
          user.lastLogin = new Date();
          if (photo && user.photo !== photo) {
            user.photo = photo;
          }
          if (name && user.displayName !== name) {
            user.displayName = name;
          }
          await user.save();
          console.log('Existing Google user logged in:', user.email);
          return done(null, user);
        }

        // If email exists, check if user exists with that email
        if (email) {
          const normalizedEmail = email.toLowerCase().trim();
          user = await User.findOne({ email: normalizedEmail });

          if (user) {
            // Link Google account to existing user
            user.googleId = googleId;
            user.displayName = name;
            user.photo = photo;
            user.lastLogin = new Date();
            await user.save();
            console.log('Linked Google account to existing user:', user.email);
            return done(null, user);
          }
        }

        // Create new user
        const newUser = new User({
          googleId,
          email: email ? email.toLowerCase().trim() : undefined,
          name,
          displayName: name,
          photo,
          lastLogin: new Date(),
          authProvider: 'google'
        });

        await newUser.save();
        console.log('New Google user created:', newUser.email || newUser.googleId);
        done(null, newUser);
      } catch (error) {
        console.error('Google Strategy Error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;