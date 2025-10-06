const express = require('express');
const { updateFIRDisposal } = require('../controllers/disposalController');
const { protect, canUpdateDisposal } = require('../middleware/permissions');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   PATCH /api/disposal/:id
 * @desc    Update FIR disposal status
 * @access  Private (Admin/SDPO only)
 */
router.patch('/:id', canUpdateDisposal, updateFIRDisposal);

module.exports = router;
