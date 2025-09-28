const express = require('express');
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   GET /api/auth/me
// @desc    Get current user (alias for profile)
// @access  Private
router.get('/me', protect, getProfile);

module.exports = router;
