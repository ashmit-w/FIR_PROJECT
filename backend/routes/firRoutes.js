const express = require('express');
const { 
  getAllFIRs, 
  getFIR, 
  createFIR, 
  updateFIR, 
  deleteFIR, 
  addRemark 
} = require('../controllers/firController');
const { 
  protect, 
  canAccessFIR, 
  canCreateFIR, 
  canDeleteFIR 
} = require('../middleware/permissions');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/firs
// @desc    Get all FIRs (filtered by role)
// @access  Private
router.get('/', getAllFIRs);

// @route   POST /api/firs
// @desc    Create new FIR
// @access  Private
router.post('/', canCreateFIR, createFIR);

// @route   GET /api/firs/:id
// @desc    Get single FIR
// @access  Private
router.get('/:id', getFIR);

// @route   PUT /api/firs/:id
// @desc    Update FIR
// @access  Private
router.put('/:id', updateFIR);

// @route   DELETE /api/firs/:id
// @desc    Delete FIR
// @access  Private (Admin only)
router.delete('/:id', canDeleteFIR, deleteFIR);

// @route   POST /api/firs/:id/remarks
// @desc    Add remark to FIR
// @access  Private
router.post('/:id/remarks', addRemark);

module.exports = router;
