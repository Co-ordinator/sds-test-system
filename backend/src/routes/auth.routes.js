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

// Update current user profile (PATCH /me or PATCH /users/me for compatibility)
router.patch('/me', verifyToken, validate(authValidation.updateProfile), authController.updateProfile);
router.patch('/users/me', verifyToken, validate(authValidation.updateProfile), authController.updateProfile);

// Data Subject Rights - Export user data
router.get('/users/me/export', verifyToken, authController.exportUserData);

// Data Subject Rights - Delete user account
router.delete('/users/me/account', verifyToken, authController.deleteUserAccount);

// Forgot password (body: identifier = email or nationalId, or email)
router.post('/forgot-password', authLimiter, validate(authValidation.forgotPasswordBody), authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', validate(authValidation.resetPassword), authController.resetPassword);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Change password (authenticated users)
router.post('/change-password', verifyToken, validate(authValidation.changePassword), authController.changePassword);

module.exports = router;
