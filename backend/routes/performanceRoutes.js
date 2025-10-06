const express = require('express');
const { getPerformanceReport } = require('../controllers/disposalController');
const { 
  protect, 
  canGenerateReports 
} = require('../middleware/permissions');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/performance-report
// @desc    Get performance report
// @access  Private (Admin only)
router.get('/', canGenerateReports, getPerformanceReport);

module.exports = router;
