const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User.model');

// @desc    Protect routes - verify JWT token
// @access  Private
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: 'Database not available. Please try again later.'
        });
      }

      // Find user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists'
        });
      }

      // Add user to request object
      req.user = user;
      next();

    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication middleware'
    });
  }
};

// @desc    Check if user has required role
// @access  Private
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// @desc    Check if user can access FIR (admin can access all, others based on role)
// @access  Private
const canAccessFIR = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }

  // Admin can access all FIRs
  if (req.user.role === 'admin') {
    return next();
  }

  // For PS role, check if FIR belongs to their police station
  if (req.user.role === 'ps') {
    const firPoliceStation = req.fir?.policeStation || req.body?.policeStation;
    if (firPoliceStation && firPoliceStation !== req.user.police_station) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access FIRs from your police station.'
      });
    }
  }

  // For SDPO role, check if FIR belongs to their subdivision
  if (req.user.role === 'sdpo') {
    const firPoliceStation = req.fir?.policeStation || req.body?.policeStation;
    if (firPoliceStation && !req.user.subdivision_stations.includes(firPoliceStation)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access FIRs from your subdivision.'
      });
    }
  }

  next();
};

// @desc    Check if user can create FIR
// @access  Private
const canCreateFIR = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }

  // Admin can create FIRs for any police station
  if (req.user.role === 'admin') {
    return next();
  }

  const { policeStation } = req.body;

  // For PS role, check if creating FIR for their police station
  if (req.user.role === 'ps') {
    if (!policeStation || policeStation !== req.user.police_station) {
      return res.status(403).json({
        success: false,
        message: 'You can only create FIRs for your police station.'
      });
    }
  }

  // For SDPO role, check if creating FIR for their subdivision
  if (req.user.role === 'sdpo') {
    if (!policeStation || !req.user.subdivision_stations.includes(policeStation)) {
      return res.status(403).json({
        success: false,
        message: 'You can only create FIRs for stations in your subdivision.'
      });
    }
  }

  next();
};

// @desc    Check if user can update disposal status
// @access  Private
const canUpdateDisposal = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }

  // Admin and SDPO can update disposal status
  if (['admin', 'sdpo'].includes(req.user.role)) {
    return next();
  }

  // PS role cannot update disposal status
  return res.status(403).json({
    success: false,
    message: 'Access denied. Only Admin and SDPO can update disposal status.'
  });
};

// @desc    Check if user can delete FIR
// @access  Private
const canDeleteFIR = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }

  // Only admin can delete FIRs
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admin can delete FIRs.'
    });
  }

  next();
};

// @desc    Check if user can generate reports
// @access  Private
const canGenerateReports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }

  // Only admin can generate reports
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admin can generate reports.'
    });
  }

  next();
};

module.exports = {
  protect,
  requireRole,
  canAccessFIR,
  canCreateFIR,
  canUpdateDisposal,
  canDeleteFIR,
  canGenerateReports
};
