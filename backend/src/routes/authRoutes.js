const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const authValidation = require('../validations/auth.validation');
const authController = require('../controllers/authController');

// Register route
router.post('/register', validate(authValidation.register), authController.register);

// Email verification route
router.get('/verify-email/:token', authController.verifyEmail);

// Login route
router.post('/login', validate(authValidation.login), authController.login);

// Get current user profile
router.get('/me', authController.getMe);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', validate(authValidation.resetPassword), authController.resetPassword);

module.exports = router;
