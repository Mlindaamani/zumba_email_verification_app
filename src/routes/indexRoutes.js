const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/authMiddleware');

// Home page
router.get('/', (req, res) => {
  res.send(`
    <h1>Simple Email Verification App</h1>
    <p><a href="/register">Register</a> | <a href="/login">Login</a></p>
  `);
});

// Dashboard (protected route)
router.get('/dashboard', requireLogin, (req, res) => {
  res.send(`
    <h1>Dashboard</h1>
    <p>Welcome, <strong>${req.user.name}</strong>.</p>
    <p>Email verified: <strong>${req.user.verified ? 'Yes' : 'No'}</strong></p>
    <p><a href="/logout">Logout</a></p>
  `);
});

module.exports = router;
