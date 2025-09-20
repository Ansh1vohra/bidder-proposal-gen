const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if email is verified for certain operations
    if (!user.emailVerified && req.method !== 'GET') {
      return res.status(403).json({
        success: false,
        message: 'Email verification required'
      });
    }

    // Add user to request object
    req.user = user;
    req.userId = user._id;
    
    // Update last activity
    user.updateLastActivity();

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check user subscription status
 */
const checkSubscription = (requiredPlan = 'basic') => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user.subscription.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required'
        });
      }

      // Check if subscription has expired
      if (user.subscription.expiresAt && user.subscription.expiresAt < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Subscription has expired'
        });
      }

      // Plan hierarchy: basic < professional < enterprise
      const planHierarchy = {
        'basic': 1,
        'professional': 2,
        'enterprise': 3
      };

      const userPlanLevel = planHierarchy[user.subscription.plan] || 0;
      const requiredPlanLevel = planHierarchy[requiredPlan] || 1;

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          success: false,
          message: `${requiredPlan} plan or higher required`,
          currentPlan: user.subscription.plan,
          requiredPlan
        });
      }

      next();
    } catch (error) {
      logger.error('Subscription check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Subscription verification failed'
      });
    }
  };
};

/**
 * Middleware to check if user has specific permissions
 */
const checkPermissions = (requiredPermissions = []) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      // Admin users have all permissions
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission => 
        user.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(permission => 
          !user.permissions.includes(permission)
        );

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          missingPermissions
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission verification failed'
      });
    }
  };
};

/**
 * Middleware to check user role
 */
const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - insufficient role',
          requiredRoles: allowedRoles,
          currentRole: user.role
        });
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role verification failed'
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // No token provided, continue without user
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
      user.updateLastActivity();
    }

    next();
  } catch (error) {
    // Token is invalid, but we continue without user
    next();
  }
};

/**
 * Middleware to verify refresh token
 */
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in user's token list
    const tokenExists = user.refreshTokens.some(token => 
      token.token === refreshToken && token.isActive
    );

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found or expired'
      });
    }

    req.user = user;
    req.refreshToken = refreshToken;
    
    next();
  } catch (error) {
    logger.error('Refresh token verification error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.body.email || '');
    const now = Date.now();
    
    // Clean old attempts
    for (const [attemptKey, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(attemptKey);
      }
    }

    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }

    if (now - userAttempts.firstAttempt > windowMs) {
      // Reset window
      attempts.set(key, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      const remainingTime = Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000);
      
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts',
        retryAfter: remainingTime
      });
    }

    userAttempts.count++;
    next();
  };
};

/**
 * Middleware to extract user info from token without strict validation
 * Used for analytics and logging
 */
const extractUserInfo = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userInfo = {
          userId: decoded.userId,
          role: decoded.role || 'user'
        };
      } catch (error) {
        // Token invalid, but we continue
        req.userInfo = null;
      }
    }

    next();
  } catch (error) {
    next(); // Continue regardless of errors
  }
};

module.exports = {
  authenticateToken,
  checkSubscription,
  checkPermissions,
  checkRole,
  optionalAuth,
  verifyRefreshToken,
  authRateLimit,
  extractUserInfo
};
