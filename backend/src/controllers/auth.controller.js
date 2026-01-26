const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, AuditLog } = require('../models');
const { logAuthAction } = require('../middleware/authentication.middleware');
const { sendEmail } = require('../config/mail.config');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Generate JWT token
const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Generate refresh token
const signRefreshToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth'
  });
};

// Register new user
const register = async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      nationalId, 
      role, 
      region,
      dateOfBirth,
      gender,
      phoneNumber,
      educationLevel,
      employmentStatus,
      preferredLanguage,
      consent
    } = req.body;
    
    // Validate consent
    if (!consent) {
      logger.warn({
        actionType: 'REGISTER_FAILED',
        message: 'Registration attempted without consent',
        req,
        details: {
          email: email
        }
      });
      return res.status(400).json({
        status: 'error',
        message: 'You must accept the data processing terms to register.'
      });
    }
    
    // Prevent self-registration of admin users
    if (role === 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin registration not allowed'
      });
    }

    // Generate email verification token
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      nationalId,
      role,
      region,
      dateOfBirth,
      gender,
      phoneNumber,
      educationLevel,
      employmentStatus,
      preferredLanguage,
      isConsentGiven: true,
      consentDate: new Date(),
      emailVerificationToken: emailToken,
      emailVerificationExpires: emailTokenExpires
    });

    logger.info({
      actionType: 'REGISTER',
      message: `User registered: ${user.email}`,
      req,
      details: {
        email: user.email,
        role: user.role
      }
    });

    // Send welcome and verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to SDS Test System - Verify Your Email',
        template: 'welcome-verify',
        context: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          region: user.region,
          verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${emailToken}`
        }
      });

      await AuditLog.create({
        userId: user.id,
        actionType: 'WELCOME_EMAIL_SENT',
        description: 'Welcome email sent',
        details: {
          resourceType: 'email',
          resourceId: user.id,
          requestMethod: 'POST',
          requestPath: '/api/v1/auth/register'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (emailError) {
      logger.error({
        actionType: 'REGISTER_FAILED',
        message: 'Email sending error',
        req,
        details: {
          error: emailError.message,
          stack: emailError.stack
        }
      });
      await AuditLog.create({
        userId: user.id,
        actionType: 'EMAIL_FAILURE',
        description: 'Failed to send welcome email',
        details: {
          resourceType: 'email',
          resourceId: user.id,
          errorMessage: emailError.message,
          requestMethod: 'POST',
          requestPath: '/api/v1/auth/register'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    // Log registration
    await logAuthAction(req, 'REGISTER');

    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    
    // Store refresh token in database
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();
    
    setRefreshTokenCookie(res, refreshToken);
    
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    logger.error({
      actionType: 'REGISTER_FAILED',
      message: 'User registration failed',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// Verify email
const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        emailVerificationToken: req.params.token,
        emailVerificationExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      logger.warn({
        actionType: 'VERIFY_EMAIL_FAILED',
        message: 'Invalid or expired email verification token',
        req,
        details: {
          token: req.params.token
        }
      });
      return res.status(400).json({
        status: 'error',
        message: 'Token is invalid or has expired'
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    logger.info({
      actionType: 'VERIFY_EMAIL',
      message: `Email verified for user: ${user.email}`,
      req,
      details: {
        userId: user.id
      }
    });

    // Log verification
    await AuditLog.create({
      userId: user.id,
      actionType: 'EMAIL_VERIFIED',
      description: 'Email verified',
      details: {
        resourceType: 'user',
        resourceId: user.id,
        requestMethod: 'GET',
        requestPath: `/api/v1/auth/verify-email/${req.params.token}`
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'Email successfully verified!'
    });
  } catch (error) {
    logger.error({
      actionType: 'VERIFY_EMAIL_FAILED',
      message: 'Email verification failed',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// User login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // 1) Check if email and password exist
    if (!email || !password) {
      logger.warn({
        actionType: 'LOGIN_FAILED',
        message: 'Missing email or password',
        req,
        details: {
          email: email,
          password: password
        }
      });
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }
    
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.comparePassword(password))) {
      logger.warn({
        actionType: 'LOGIN_FAILED',
        message: 'Failed login attempt',
        req,
        details: {
          email: email
        }
      });
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }
    
    // 3) Check if email is verified
    if (!user.isEmailVerified) {
      logger.warn({
        actionType: 'LOGIN_FAILED',
        message: 'Login attempt with unverified email',
        req,
        details: {
          email: user.email,
          userId: user.id
        }
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'Your email address is not verified. Please check your inbox for the verification link.',
        requiresVerification: true
      });
    }
    
    // 4) Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info({
      actionType: 'LOGIN',
      message: `User logged in: ${user.email}`,
      req,
      details: {
        userId: user.id
      }
    });

    // 5) Log login
    await logAuthAction(req, 'LOGIN');
    
    // 6) Send token to client
    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    
    // Store refresh token in database
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();
    
    setRefreshTokenCookie(res, refreshToken);
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    logger.error({
      actionType: 'LOGIN_FAILED',
      message: 'Login failed',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// Get current user profile
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken'] }
    });
    
    if (!user) {
      logger.warn({
        actionType: 'GET_ME_FAILED',
        message: 'User not found',
        req,
        details: {
          userId: req.user.id
        }
      });
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    logger.info({
      actionType: 'GET_ME',
      message: `User profile retrieved: ${user.email}`,
      req,
      details: {
        userId: user.id
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error({
      actionType: 'GET_ME_FAILED',
      message: 'Failed to retrieve user profile',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// Forgot password
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    
    if (!user) {
      logger.warn({
        actionType: 'FORGOT_PASSWORD_FAILED',
        message: 'User not found',
        req,
        details: {
          email: req.body.email
        }
      });
      return res.status(404).json({
        status: 'error',
        message: 'No user found with that email'
      });
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Save token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();
    
    logger.info({
      actionType: 'FORGOT_PASSWORD',
      message: `Password reset token sent to user: ${user.email}`,
      req,
      details: {
        userId: user.id
      }
    });

    // Send reset email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        template: 'reset-password',
        context: {
          firstName: user.firstName,
          resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
        }
      });

      await AuditLog.create({
        userId: user.id,
        actionType: 'PASSWORD_RESET_EMAIL_SENT',
        description: 'Password reset email sent',
        details: {
          resourceType: 'email',
          resourceId: user.id,
          requestMethod: 'POST',
          requestPath: '/api/v1/auth/forgot-password'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (emailError) {
      logger.error({
        actionType: 'FORGOT_PASSWORD_FAILED',
        message: 'Password reset email error',
        req,
        details: {
          error: emailError.message,
          stack: emailError.stack
        }
      });
      await AuditLog.create({
        userId: user.id,
        actionType: 'EMAIL_FAILURE',
        description: 'Failed to send password reset email',
        details: {
          resourceType: 'email',
          resourceId: user.id,
          errorMessage: emailError.message,
          requestMethod: 'POST',
          requestPath: '/api/v1/auth/forgot-password'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (error) {
    logger.error({
      actionType: 'FORGOT_PASSWORD_FAILED',
      message: 'Failed to send password reset token',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// Reset password
const resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on token
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    
    const user = await User.findOne({
      where: {
        id: decoded.id,
        passwordResetToken: req.params.token,
        passwordResetExpires: { [Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      logger.warn({
        actionType: 'RESET_PASSWORD_FAILED',
        message: 'Invalid or expired password reset token',
        req,
        details: {
          token: req.params.token
        }
      });
      return res.status(400).json({
        status: 'error',
        message: 'Token is invalid or has expired'
      });
    }
    
    // 2) Update password
    user.password = req.body.password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    logger.info({
      actionType: 'RESET_PASSWORD',
      message: `Password reset for user: ${user.email}`,
      req,
      details: {
        userId: user.id
      }
    });

    // 3) Log password reset
    await logAuthAction(req, 'PASSWORD_RESET');
    
    // 4) Log the user in, send JWT
    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    setRefreshTokenCookie(res, refreshToken);
    
    res.status(200).json({
      status: 'success',
      token
    });
  } catch (error) {
    logger.error({
      actionType: 'RESET_PASSWORD_FAILED',
      message: 'Failed to reset password',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// Refresh access token
const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'No refresh token provided'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if user exists and token matches
    const user = await User.findOne({
      where: {
        id: decoded.id,
        refreshToken,
        refreshTokenExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = signToken(user.id, user.role);
    
    res.status(200).json({
      status: 'success',
      token: newAccessToken
    });
  } catch (error) {
    logger.error({
      actionType: 'REFRESH_TOKEN_FAILED',
      message: 'Failed to refresh token',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// Logout user
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Find user by refresh token and clear it
      const user = await User.findOne({
        where: { refreshToken }
      });
      
      if (user) {
        user.refreshToken = null;
        user.refreshTokenExpires = null;
        await user.save();
      }
      
      // Clear cookie
      res.clearCookie('refreshToken', {
        path: '/api/v1/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error({
      actionType: 'LOGOUT_FAILED',
      message: 'Failed to logout',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// Export all user data
const exportUserData = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { 
          association: 'assessments', 
          include: [
            { association: 'answers' }
          ]
        },
        { association: 'auditLogs' }
      ]
    });

    if (!user) {
      logger.warn({
        actionType: 'DATA_EXPORT_FAILED',
        message: 'User not found for data export',
        req,
        details: {
          userId: req.user.id
        }
      });
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    logger.info({
      actionType: 'DATA_EXPORT',
      message: `User data exported: ${user.email}`,
      req,
      details: {
        userId: user.id
      }
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${user.id}_data_export.json`);

    res.status(200).send(JSON.stringify(user, null, 2));
  } catch (error) {
    logger.error({
      actionType: 'DATA_EXPORT_FAILED',
      message: 'Failed to export user data',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// Delete user account
const deleteUserAccount = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      logger.warn({
        actionType: 'ACCOUNT_DELETION_FAILED',
        message: 'User not found for deletion',
        req,
        details: {
          userId: req.user.id
        }
      });
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Log deletion before it happens
    await AuditLog.create({
      userId: user.id,
      actionType: 'ACCOUNT_DELETED_BY_USER',
      description: 'User deleted own account',
      details: {
        resourceType: 'user',
        resourceId: user.id,
        requestMethod: req.method,
        requestPath: req.path
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Delete user (cascading deletes will handle related records)
    await user.destroy();

    logger.info({
      actionType: 'ACCOUNT_DELETION',
      message: `User account deleted: ${user.email}`,
      req,
      details: {
        userId: user.id
      }
    });

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/v1/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error({
      actionType: 'ACCOUNT_DELETION_FAILED',
      message: 'Failed to delete user account',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      logger.warn({
        actionType: 'RESEND_VERIFICATION_FAILED',
        message: 'User not found',
        req,
        details: {
          email
        }
      });
      return res.status(404).json({
        status: 'error',
        message: 'No user found with that email'
      });
    }
    
    // Check if already verified
    if (user.isEmailVerified) {
      logger.warn({
        actionType: 'RESEND_VERIFICATION_FAILED',
        message: 'Email already verified',
        req,
        details: {
          email,
          userId: user.id
        }
      });
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified'
      });
    }
    
    // Generate new token
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Update user
    user.emailVerificationToken = emailToken;
    user.emailVerificationExpires = emailTokenExpires;
    await user.save();
    
    // Send verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email Address',
        template: 'welcome-verify',
        context: {
          firstName: user.firstName,
          verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${emailToken}`
        }
      });

      logger.info({
        actionType: 'VERIFICATION_EMAIL_RESENT',
        message: `Verification email resent to user: ${user.email}`,
        req,
        details: {
          userId: user.id
        }
      });

      await AuditLog.create({
        userId: user.id,
        actionType: 'VERIFICATION_EMAIL_RESENT',
        description: 'Verification email resent',
        details: {
          resourceType: 'email',
          resourceId: user.id,
          requestMethod: 'POST',
          requestPath: '/api/v1/auth/resend-verification'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(200).json({
        status: 'success',
        message: 'Verification email resent'
      });
    } catch (emailError) {
      logger.error({
        actionType: 'RESEND_VERIFICATION_FAILED',
        message: 'Email sending error',
        req,
        details: {
          error: emailError.message,
          stack: emailError.stack
        }
      });
      await AuditLog.create({
        userId: user.id,
        actionType: 'EMAIL_FAILURE',
        description: 'Failed to resend verification email',
        details: {
          resourceType: 'email',
          resourceId: user.id,
          errorMessage: emailError.message,
          requestMethod: 'POST',
          requestPath: '/api/v1/auth/resend-verification'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to send verification email'
      });
    }
  } catch (error) {
    logger.error({
      actionType: 'RESEND_VERIFICATION_FAILED',
      message: 'Failed to resend verification email',
      req,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  logout,
  exportUserData,
  deleteUserAccount,
};
