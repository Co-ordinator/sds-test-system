const express = require('express');
const router = express.Router();
const validate = require('../middleware/validatation.middleware');
const authValidation = require('../validations/auth.validation');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiting.middleware');
const { verifyToken } = require('../middleware/authentication.middleware');

// Register route
router.post('/register', authLimiter, validate(authValidation.register), authController.register);

// Email verification route
router.get('/verify-email/:token', authController.verifyEmail);

// Resend verification email
router.post('/resend-verification', authLimiter, validate(authValidation.resendVerification), authController.resendVerificationEmail);

// Login route
router.post('/login', authLimiter, validate(authValidation.login), authController.login);

// Get current user profile
router.get('/me', verifyToken, authController.getMe);

// Data Subject Rights - Export user data
router.get('/users/me/export', verifyToken, authController.exportUserData);

// Data Subject Rights - Delete user account
router.delete('/users/me/account', verifyToken, authController.deleteUserAccount);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', validate(authValidation.resetPassword), authController.resetPassword);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
