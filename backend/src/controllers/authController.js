const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId, role = 'user') => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      company,
      role = 'user'
    } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role,
      emailVerificationToken,
      emailVerificationExpires
    };

    if (phone) userData.phone = phone;
    if (company) userData.company = company;

    const user = new User(userData);
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user._id, user.role);

    // Add refresh token to user
    await user.addRefreshToken(tokens.refreshToken, req.ip, req.headers['user-agent']);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Log registration
    logger.info(`User registered: ${user.email}`);

    // Return user data without sensitive information
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.emailVerificationToken;

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user: userResponse,
        tokens
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      user.loginAttempts.push({
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: false
      });
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check for too many failed attempts
    const recentFailedAttempts = user.loginAttempts.filter(attempt => 
      !attempt.success && 
      new Date() - attempt.timestamp < 15 * 60 * 1000 // Last 15 minutes
    );

    if (recentFailedAttempts.length >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed login attempts. Please try again later.'
      });
    }

    // Generate tokens
    const tokens = generateTokens(user._id, user.role);

    // Add refresh token to user
    await user.addRefreshToken(tokens.refreshToken, req.ip, req.headers['user-agent']);

    // Log successful login
    user.loginAttempts.push({
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    // Return user data without sensitive information
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.emailVerificationToken;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const user = req.user;
    const oldRefreshToken = req.refreshToken;

    // Generate new tokens
    const tokens = generateTokens(user._id, user.role);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(oldRefreshToken);
    await user.addRefreshToken(tokens.refreshToken, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken) {
      await user.removeRefreshToken(refreshToken);
    }

    logger.info(`User logged out: ${user.email}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Logout from all devices
 */
const logoutAll = async (req, res) => {
  try {
    const user = req.user;

    // Remove all refresh tokens
    user.refreshTokens = [];
    await user.save();

    logger.info(`User logged out from all devices: ${user.email}`);

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Verify email address
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    logger.info(`Email verified: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};

/**
 * Resend email verification
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
};

/**
 * Forgot password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed'
    });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();

    // Invalidate all refresh tokens for security
    user.refreshTokens = [];

    await user.save();

    logger.info(`Password reset successful: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
};

/**
 * Change password (for authenticated users)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Verify current password
    const userWithPassword = await User.findById(user._id);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    userWithPassword.password = hashedPassword;
    userWithPassword.passwordChangedAt = new Date();
    await userWithPassword.save();

    logger.info(`Password changed: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed'
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    // Return user data without sensitive information
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.emailVerificationToken;
    delete userResponse.passwordResetToken;

    res.json({
      success: true,
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile
};
