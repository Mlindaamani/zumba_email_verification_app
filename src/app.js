const express = require('express');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import configurations
const configurePassport = require('./config/passport');

// Import routes
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Routes
app.use('/', indexRoutes);
app.use('/', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('<p>Something went wrong. Please try again later.</p><a href="/">Home</a>');
});

module.exports = app;
