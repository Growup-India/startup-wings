// config/Passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');

// IMPORTANT: prevent mongoose from buffering commands when not connected
mongoose.set('bufferCommands', false);

// Helper - initialize strategies only when DB available
function initPassportStrategies() {
  // require models lazily so they use the connected mongoose instance
  const User = require('../models/user');

  // Avoid re-registering strategies (safe check)
  try {
    if (typeof passport._strategy === 'function' && passport._strategy('google')) {
      console.log('[Passport] Google strategy already registered — skipping re-init');
      return;
    }
  } catch (e) {
    // old passport impl or internal API differences - ignore and continue
  }

  // Serialize / deserialize (if you ever use sessions)
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const u = await User.findById(id).exec();
      done(null, u);
    } catch (err) {
      done(err);
    }
  });

  // Validate required env vars for Google strategy (log warnings instead of crashing)
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallback = process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback';

  if (!googleClientId || !googleClientSecret) {
    console.warn('[Passport] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. Google OAuth will be disabled.');
    return;
  }

  // Google OAuth strategy (defensive)
  passport.use(new GoogleStrategy({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallback,
      passReqToCallback: true
    },
    // verify callback
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // 1) Guard: ensure DB is connected (avoid triggering buffered queries)
        if (mongoose.connection.readyState !== 1) {
          const err = new Error('Database not connected');
          err.code = 'DB_NOT_CONNECTED';
          console.error('[GOOGLE STRATEGY] DB not connected, rejecting auth attempt');
          return done(err);
        }

        // 2) Extract email (defensive)
        const email = profile && profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) {
          console.warn('[GOOGLE STRATEGY] No email returned from Google profile', profile && profile.id);
          return done(new Error('No email available from Google profile'));
        }

        // 3) Use exec() and try/catch for DB operations
        let user;
        try {
          user = await User.findOne({ email }).exec();
        } catch (dbErr) {
          console.error('[GOOGLE STRATEGY] DB error during findOne:', dbErr);
          return done(dbErr);
        }

        if (user) {
          // update profile info if needed (non-blocking)
          try {
            const updates = {};
            if (!user.googleId && profile.id) updates.googleId = profile.id;
            if (!user.photo && profile.photos && profile.photos[0] && profile.photos[0].value) updates.photo = profile.photos[0].value;
            if (Object.keys(updates).length > 0) {
              await User.findByIdAndUpdate(user._id, { $set: updates }).exec();
            }
          } catch (updateErr) {
            // Log but do not fail auth for update issues
            console.warn('[GOOGLE STRATEGY] Failed to update user metadata:', updateErr);
          }
          return done(null, user);
        }

        // If user doesn't exist, create one (defensive)
        try {
          const newUser = new User({
            name: profile.displayName || email.split('@')[0],
            email,
            googleId: profile.id,
            photo: profile.photos && profile.photos[0] && profile.photos[0].value,
            isActive: true,
            accountType: 'google'
          });
          await newUser.save();
          return done(null, newUser);
        } catch (createErr) {
          console.error('[GOOGLE STRATEGY] Error creating user:', createErr);
          return done(createErr);
        }
      } catch (err) {
        console.error('[GOOGLE STRATEGY] Unexpected error:', err);
        return done(err);
      }
    }
  ));
}

// If mongoose is already connected -> init now. Otherwise init when connected.
if (mongoose.connection.readyState === 1) {
  console.log('[Passport] Mongoose already connected — initializing strategies');
  try {
    initPassportStrategies();
  } catch (err) {
    console.error('[Passport] Failed to init strategies on startup:', err);
  }
} else {
  console.log('[Passport] Mongoose not yet connected — deferring strategy initialization until connected');
  mongoose.connection.once('connected', () => {
    console.log('[Passport] Mongoose connected event received — initializing strategies');
    try {
      initPassportStrategies();
    } catch (err) {
      console.error('[Passport] Failed to init strategies after DB connection:', err);
    }
  });

  // Optional: handle reconnection case (re-init only if needed)
  mongoose.connection.on('reconnected', () => {
    try {
      const already = typeof passport._strategy === 'function' && passport._strategy('google');
      if (!already) {
        console.log('[Passport] Mongoose reconnected — initializing strategies (reconnected)');
        initPassportStrategies();
      }
    } catch (err) {
      // best-effort: attempt init if not registered
      try {
        initPassportStrategies();
      } catch (err2) {
        console.error('[Passport] Error during re-init on reconnect:', err2);
      }
    }
  });
}

// Export passport so require('./config/Passport') can be used as before
module.exports = passport;
