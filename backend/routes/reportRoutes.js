const express = require('express');
const { generatePerformanceReport, generateFIRReport } = require('../controllers/reportController');
const { protect, canGenerateReports } = require('../middleware/permissions');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/reports/performance
 * @desc    Generate comprehensive performance report
 * @access  Private (Admin/SDPO only)
 */
router.get('/performance', canGenerateReports, generatePerformanceReport);

/**
 * @route   GET /api/reports/firs
 * @desc    Generate detailed FIR report with filtering and pagination
 * @access  Private (Admin/SDPO only)
 */
router.get('/firs', canGenerateReports, generateFIRReport);

module.exports = router;
