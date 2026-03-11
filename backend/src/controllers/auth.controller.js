const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, AuditLog } = require('../models');
const { logAuthAction } = require('../middleware/authentication.middleware');
const { sendEmail } = require('../config/email.config');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { generateStudentCode } = require('../utils/generateStudentCode');

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

// Register new user (email OR phone, password, consent; verify email only when email provided)
const register = async (req, res, next) => {
  try {
    const {
      email, password, phoneNumber, consent,
      userType, degreeProgram, yearOfStudy, yearsExperience,
      currentOccupation
    } = req.body;
    const hasEmail = email && String(email).trim().length > 0;
    const hasPhone = phoneNumber && String(phoneNumber).trim().length > 0;

    if (!consent) {
      logger.warn({
        actionType: 'REGISTER_FAILED',
        message: 'Registration attempted without consent',
        req,
        details: { email: email || phoneNumber }
      });
      return res.status(400).json({
        status: 'error',
        message: 'You must accept the data processing terms to register.'
      });
    }

    if (!hasEmail && !hasPhone) {
      return res.status(400).json({
        status: 'error',
        message: 'Email or phone is required'
      });
    }

    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate universal login number for all users
    const studentCode = await generateStudentCode();

    const user = await User.create({
      email: hasEmail ? email.trim() : null,
      password,
      firstName: 'Pending',
      lastName: 'User',
      role: 'user',
      userType: userType || null,
      degreeProgram: degreeProgram || null,
      yearOfStudy: yearOfStudy ? parseInt(yearOfStudy, 10) : null,
      yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : null,
      currentOccupation: currentOccupation || null,
      phoneNumber: hasPhone ? phoneNumber.trim() : null,
      studentCode,
      isConsentGiven: true,
      consentDate: new Date(),
      emailVerificationToken: hasEmail ? emailToken : null,
      emailVerificationExpires: hasEmail ? emailTokenExpires : null
    });

    logger.info({
      actionType: 'REGISTER',
      message: `User registered: ${user.email || user.phoneNumber}`,
      req,
      details: {
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });

    // Send welcome and verification email only when user has email
    if (user.email) {
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
          actionType: 'SYSTEM',
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
          actionType: 'SYSTEM',
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
    }

    // Log registration (pass user.id since req.user is not set yet)
    await logAuthAction(req, 'REGISTER', user.id);

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

    let token = null;

    try {
      // Log verification
      await AuditLog.create({
        userId: user.id,
        actionType: 'SYSTEM',
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

      token = signToken(user.id, user.role);
      const refreshToken = signRefreshToken(user.id, user.role);
      user.refreshToken = refreshToken;
      user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();
      setRefreshTokenCookie(res, refreshToken);
    } catch (postVerifyError) {
      logger.warn({
        actionType: 'VERIFY_EMAIL',
        message: 'Email verified, but post-verification setup failed',
        req,
        details: {
          userId: user.id,
          error: postVerifyError.message,
          stack: postVerifyError.stack
        }
      });
    }

    res.status(200).json({
      status: 'success',
      message: token ? 'Email successfully verified!' : 'Email successfully verified. Please log in.',
      ...(token ? { token } : {}),
      data: {
        user: user.toJSON()
      }
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

// User login (accepts email, username, or student_number)
const login = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier ?? req.body.email ?? req.body.username ?? '').toString().trim();
    const password = req.body.password;
    
    // 1) Check if identifier and password exist
    if (!identifier || !password) {
      logger.warn({
        actionType: 'LOGIN_FAILED',
        message: 'Missing identifier or password',
        req,
        details: { identifier: identifier ? 'present' : 'missing' }
      });
      return res.status(400).json({
        status: 'error',
        message: 'Please provide your email or username and password'
      });
    }
    
    // 2) Find user by studentCode (universal login number), email, username, or student_number
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { studentCode: identifier },
          { email: identifier },
          { username: identifier },
          { studentNumber: identifier }
        ]
      }
    });
    
    if (!user || !(await user.comparePassword(password))) {
      logger.warn({
        actionType: 'LOGIN_FAILED',
        message: 'Failed login attempt',
        req,
        details: { identifier: identifier.slice(0, 3) + '***' }
      });
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email/username or password'
      });
    }
    
    // 3) Check if email is verified — skip for counselor-created students (no email)
    const requiresVerification = user.email && !user.isEmailVerified && !user.createdByCounselor;
    if (requiresVerification) {
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

    // 5) Log login (pass user.id since req.user is not set yet)
    await logAuthAction(req, 'LOGIN', user.id);
    
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
      message: `User profile retrieved: ${user.email || user.phoneNumber || user.id}`,
      req,
      details: {
        userId: user.id
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: user.toJSON ? user.toJSON() : user
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

// Update current user profile (allowed fields only)
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const allowed = [
      'firstName', 'lastName', 'gender', 'nationalId', 'phoneNumber', 'region', 'district', 'address', 'educationLevel',
      'currentInstitution', 'gradeLevel', 'employmentStatus', 'currentOccupation',
      'preferredLanguage', 'requiresAccessibility', 'accessibilityNeeds'
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key] === '' || req.body[key] === null ? null : req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No valid fields to update' });
    }

    await user.update(updates);

    const updated = await User.findByPk(user.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken', 'refreshToken'] }
    });

    logger.info({
      actionType: 'PROFILE_UPDATE',
      message: `Profile updated: ${user.email}`,
      req,
      details: { userId: user.id }
    });

    res.status(200).json({
      status: 'success',
      data: { user: updated }
    });
  } catch (error) {
    logger.error({
      actionType: 'PROFILE_UPDATE_FAILED',
      message: 'Failed to update profile',
      req,
      details: { error: error.message }
    });
    next(error);
  }
};

// Forgot password (accepts login number, email, username, or student number)
const forgotPassword = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier || req.body.email || '').trim();
    if (!identifier) {
      return res.status(400).json({
        status: 'error',
        message: 'Login number, email, username, or student number is required'
      });
    }

    // Find user by any login identifier (same as login flow)
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { studentCode: identifier },
          { email: identifier },
          { username: identifier },
          { studentNumber: identifier }
        ]
      }
    });

    if (!user) {
      logger.warn({
        actionType: 'FORGOT_PASSWORD_FAILED',
        message: 'User not found',
        req,
        details: { identifier: identifier.replace(/(?<=.).(?=.)/g, '*') }
      });
      return res.status(404).json({
        status: 'error',
        message: 'No user found with that login number, email, username, or student number'
      });
    }

    if (!user.email) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot send reset link: no email on file'
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
        actionType: 'SYSTEM',
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
        actionType: 'SYSTEM',
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
    
    // 2) Update password (validation provides newPassword/confirmPassword)
    user.password = req.body.newPassword ?? req.body.password;
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

    // 3) Log password reset (AuditLog enum uses PASSWORD_CHANGE; pass user.id - no req.user on this route)
    await logAuthAction(req, 'PASSWORD_CHANGE', user.id);
    
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
    const refreshToken = req.cookies?.refreshToken;
    
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
    const refreshToken = req.cookies?.refreshToken;
    
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
      actionType: 'SYSTEM',
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

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully'
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
        actionType: 'SYSTEM',
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
        actionType: 'SYSTEM',
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
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  logout,
  exportUserData,
  deleteUserAccount,
};
