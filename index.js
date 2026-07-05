const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'email',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});




function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const mailTransport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      const user = rows[0];
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

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, verified FROM users WHERE id = ?', [id]);
    done(null, rows[0] || false);
  } catch (error) {
    done(error);
  }
});

function requireLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect('/login');
}

app.get('/', (req, res) => {
  res.send(`
    <h1>Simple Email Verification App</h1>
    <p><a href="/register">Register</a> | <a href="/login">Login</a></p>
  `);
});

app.get('/register', (req, res) => {
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
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.send('<p>Please fill all fields.</p><a href="/register">Back</a>');
  }
  if (!isValidEmail(email)) {
    return res.send('<p>Email is not valid. Use a real email address.</p><a href="/register">Back</a>');
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.send('<p>Email already registered. Please login or use another email.</p><a href="/register">Back</a>');
    }
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const verifyToken = generateToken();
    await pool.query(
      'INSERT INTO users (name, email, password_hash, password_salt, verified, verify_token) VALUES (?, ?, ?, ?, 0, ?)',
      [name, email, passwordHash, salt, verifyToken]
    );

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
});

app.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.send('<p>Invalid verification link.</p><a href="/">Home</a>');
  }
  try {
    const [rows] = await pool.query('SELECT id, email FROM users WHERE verify_token = ?', [token]);
    if (rows.length === 0) {
      return res.send('<p>Email not verified. Token is invalid or expired.</p><a href="/">Home</a>');
    }
    await pool.query('UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?', [rows[0].id]);
    res.send(`
      <h2>Email Verified</h2>
      <p>Your email <strong>${rows[0].email}</strong> is now verified.</p>
      <p><a href="/login">Login</a></p>
    `);
  } catch (error) {
    console.error('Verify error:', error);
    res.send('<p>Failed to verify email. Please try again later.</p><a href="/">Home</a>');
  }
});

app.get('/login', (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="POST" action="/login">
      <label>Email:<br><input name="email" type="email" required></label><br><br>
      <label>Password:<br><input name="password" type="password" required></label><br><br>
      <button type="submit">Login</button>
    </form>
    <p><a href="/register">Create an account</a></p>
  `);
});

app.post('/login', (req, res, next) => {
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
});

app.get('/dashboard', requireLogin, (req, res) => {
  res.send(`
    <h1>Dashboard</h1>
    <p>Welcome, <strong>${req.user.name}</strong>.</p>
    <p>Email verified: <strong>${req.user.verified ? 'Yes' : 'No'}</strong></p>
    <p><a href="/logout">Logout</a></p>
  `);
});

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
