const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

const configurePassport = () => {
  
  // GOOGLE STRATEGY
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // If user exists but used email/pass, link googleId
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          isVerified: true // OAuth implies verified email
        });
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));

  // GITHUB STRATEGY
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
      scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // GitHub might not return public email, handle edge case if needed
        const email = profile.emails?.[0]?.value || `${profile.username}@github.com`; 
        
        let user = await User.findOne({ $or: [{ email }, { githubId: profile.id }] });

        if (user) {
          if (!user.githubId) {
            user.githubId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        user = await User.create({
          name: profile.displayName || profile.username,
          email: email,
          githubId: profile.id,
          isVerified: true
        });
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
};

module.exports = configurePassport;