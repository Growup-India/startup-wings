const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

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

// FIXED: Use full callback URL instead of relative path
const getCallbackURL = () => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${baseUrl}/auth/google/callback`;
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL(), // FIXED: Full URL
      proxy: true,
      // ADDED: For mobile support
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('=== Google OAuth Callback ===');
        console.log('Google Profile ID:', profile.id);
        console.log('Email:', profile.emails?.[0]?.value);
        console.log('Callback URL used:', getCallbackURL());

        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;
        const photo = profile.photos?.[0]?.value;
        const givenName = profile.name?.givenName || '';
        const familyName = profile.name?.familyName || '';
        const name = givenName && familyName 
          ? `${givenName} ${familyName}`.trim() 
          : displayName || 'Google User';

        if (!googleId) {
          return done(new Error('Google ID not provided'), null);
        }

        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        // Try to find user by googleId first
        let user = await User.findOne({ googleId });

        if (user) {
          console.log('✅ Existing Google user found:', user.email);
          user.lastLogin = new Date();
          
          // Update profile info if changed
          if (displayName && user.displayName !== displayName) {
            user.displayName = displayName;
          }
          if (photo && user.photo !== photo) {
            user.photo = photo;
          }
          if (name && user.name !== name) {
            user.name = name;
          }
          
          await user.save();
          return done(null, user);
        }

        // Check if email exists (link Google account)
        if (normalizedEmail) {
          user = await User.findOne({ email: normalizedEmail });
          
          if (user) {
            console.log('✅ Linking Google account to existing email:', normalizedEmail);
            user.googleId = googleId;
            user.displayName = displayName || user.displayName;
            user.photo = photo || user.photo;
            user.name = name || user.name;
            user.isEmailVerified = true; // Mark as verified
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        console.log('✅ Creating new Google user');
        user = new User({
          googleId,
          email: normalizedEmail,
          name: name,
          displayName,
          photo,
          isEmailVerified: true, // Google emails are verified
          lastLogin: new Date()
        });
        
        await user.save();
        console.log('✅ New Google user created successfully');
        
        return done(null, user);
      } catch (error) {
        console.error('❌ Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;