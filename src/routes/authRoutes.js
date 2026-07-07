const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration routes
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// Email verification
router.get('/verify', authController.verifyEmail);

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
