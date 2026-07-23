const express = require('express');
const router = express.Router();
const validate = require('../middleware/validatation.middleware');
const authValidation = require('../validations/auth.validation');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/authentication.middleware');

// Note: /me endpoints are self-only by design (no resourceId param for selfOnly middleware)
// Controllers use req.user.id to operate on the authenticated user's data only

// Register route
router.post('/register', validate(authValidation.register), authController.register);

// Email verification via 6-digit OTP
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);

// Resend verification email (new OTP)
router.post('/resend-verification', validate(authValidation.resendVerification), authController.resendVerificationEmail);

// Login route
router.post('/login', validate(authValidation.login), authController.login);

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
router.post('/forgot-password', validate(authValidation.forgotPasswordBody), authController.forgotPassword);

// Reset password — token in body (preferred). Keep :token path as a deprecated
// alias for any reset emails already in inboxes that point at the old URL.
router.post('/reset-password', validate(authValidation.resetPasswordWithToken), authController.resetPassword);
router.post('/reset-password/:token', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/reset-password-otp', validate(authValidation.resetPasswordWithOtp), authController.resetPasswordWithOtp);

// Refresh token — rate-limited even though it requires a valid cookie, so a
// stolen RT can't be replayed unbounded.
router.post('/refresh-token', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Change password (authenticated users)
router.post('/change-password', verifyToken, validate(authValidation.changePassword), authController.changePassword);

module.exports = router;
