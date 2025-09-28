const express = require('express');
const { updateFIRDisposal, getPerformanceReport } = require('../controllers/disposalController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/performance-report
// @desc    Get performance report
// @access  Private (Admin/SDPO only)
router.get('/', authorize('admin', 'sdpo'), getPerformanceReport);

// @route   PATCH /api/firs/:id/disposal
// @desc    Update FIR disposal status
// @access  Private
router.patch('/:id/disposal', updateFIRDisposal);

module.exports = router;
