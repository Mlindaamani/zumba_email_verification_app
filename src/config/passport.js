const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { hashPassword } = require('../utils/crypto');
const userModel = require('../models/userModel');

/**
 * Configure Passport authentication strategy
 */
const configurePassport = () => {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await userModel.findByEmail(email);
        
        if (!user) {
          return done(null, false, { message: 'Email or password is not correct.' });
        }

        const passwordHash = hashPassword(password, user.password_salt);
        if (passwordHash !== user.password_hash) {
          return done(null, false, { message: 'Email or password is not correct.' });
        }

        if (!user.verified) {
          return done(null, false, { message: 'Email not verified. Please check your inbox.' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userModel.findById(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });
};

module.exports = configurePassport;
