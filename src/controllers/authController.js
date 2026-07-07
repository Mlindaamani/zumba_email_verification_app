const passport = require('passport');
const { generateSalt, hashPassword, generateToken } = require('../utils/crypto');
const { isValidEmail } = require('../utils/validators');
const userModel = require('../models/userModel');
const mailTransport = require('../config/email');

/**
 * Show registration page
 */
const getRegister = (req, res) => {
  res.send(`
    <h1>Register</h1>
    <form method="POST" action="/register">
      <label>Name:<br><input name="name" required></label><br><br>
      <label>Email:<br><input name="email" type="email" required></label><br><br>
      <label>Password:<br><input name="password" type="password" required></label><br><br>
      <button type="submit">Register</button>
    </form>
    <p><a href="/login">Already have an account? Login</a></p>
  `);
};

/**
 * Handle registration submission
 */
const postRegister = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.send('<p>Please fill all fields.</p><a href="/register">Back</a>');
  }

  if (!isValidEmail(email)) {
    return res.send('<p>Email is not valid. Use a real email address.</p><a href="/register">Back</a>');
  }

  try {
    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.send('<p>Email already registered. Please login or use another email.</p><a href="/register">Back</a>');
    }

    // Create user
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const verifyToken = generateToken();

    await userModel.create({
      name,
      email,
      passwordHash,
      salt,
      verifyToken,
    });

    // Send verification email
    const verifyUrl = `${req.protocol}://${req.get('host')}/verify?token=${verifyToken}`;
    await mailTransport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      html: `<p>Hello ${name},</p><p>Click the link below to verify your email address:</p><p><a href="${verifyUrl}">Verify Email</a></p>`,
    });

    res.send(`
      <h2>Registration successful</h2>
      <p>Verification email sent to <strong>${email}</strong>. Check your Gmail inbox and click the verification link.</p>
      <p><a href="/login">Login</a></p>
    `);
  } catch (error) {
    console.error('Register error:', error);
    res.send('<p>Failed to register. Please try again later.</p><a href="/register">Back</a>');
  }
};

/**
 * Handle email verification
 */
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.send('<p>Invalid verification link.</p><a href="/">Home</a>');
  }

  try {
    const user = await userModel.findByVerifyToken(token);

    if (!user) {
      return res.send('<p>Email not verified. Token is invalid or expired.</p><a href="/">Home</a>');
    }

    await userModel.markAsVerified(user.id);

    res.send(`
      <h2>Email Verified</h2>
      <p>Your email <strong>${user.email}</strong> is now verified.</p>
      <p><a href="/login">Login</a></p>
    `);
  } catch (error) {
    console.error('Verify error:', error);
    res.send('<p>Failed to verify email. Please try again later.</p><a href="/">Home</a>');
  }
};

/**
 * Show login page
 */
const getLogin = (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="POST" action="/login">
      <label>Email:<br><input name="email" type="email" required></label><br><br>
      <label>Password:<br><input name="password" type="password" required></label><br><br>
      <button type="submit">Login</button>
    </form>
    <p><a href="/register">Create an account</a></p>
  `);
};

/**
 * Handle login submission
 */
const postLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.send(`<p>${info && info.message ? info.message : 'Login failed.'}</p><a href="/login">Back</a>`);
    }
    req.logIn(user, (loginError) => {
      if (loginError) {
        return next(loginError);
      }
      return res.redirect('/dashboard');
    });
  })(req, res, next);
};

/**
 * Handle logout
 */
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
};

module.exports = {
  getRegister,
  postRegister,
  verifyEmail,
  getLogin,
  postLogin,
  logout,
};
