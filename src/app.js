const express = require("express");
const session = require("express-session");
const passport = require("passport");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

// Import configurations
const configurePassport = require("./config/passport");
const flashMiddleware = require("./middleware/flashMiddleware");

// Import routes
const indexRoutes = require("./routes/indexRoutes");
const authRoutes = require("./routes/authRoutes");const profileRoutes = require('./routes/profileRoutes');
// Initialize Express app
const app = express();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Flash messages middleware
app.use(flashMiddleware);

// Routes
app.use("/", indexRoutes);
app.use("/", authRoutes);
app.use('/', profileRoutes);// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res
    .status(500)
    .send(
      '<p>Something went wrong. Please try again later.</p><a href="/">Home</a>',
    );
});

module.exports = app;
