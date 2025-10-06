const FIR = require('../models/FIR.model');
const mongoose = require('mongoose');

/**
 * Update FIR disposal status
 * Allows all status transitions: Registered ↔ Chargesheeted ↔ Finalized
 * @route PATCH /api/firs/:id/disposal
 * @access Private (Admin/SDPO only)
 */
const updateFIRDisposal = async (req, res) => {
  try {
    const { status, dateOfDisposal } = req.body;
    const firId = req.params.id;

    // Validate required fields
    if (!status || !dateOfDisposal) {
      return res.status(400).json({
        success: false,
        message: 'Status and date of disposal are required'
      });
    }

    // Validate status values
    if (!['Registered', 'Chargesheeted', 'Finalized'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: Registered, Chargesheeted, Finalized'
      });
    }

    // Validate FIR ID format
    if (!mongoose.Types.ObjectId.isValid(firId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid FIR ID format'
      });
    }

    // Find the FIR
    const fir = await FIR.findById(firId)
      .populate('policeStationId', 'name code subdivision')
      .populate('createdBy', 'username role')
      .populate('assignedTo', 'username role');

    if (!fir) {
      return res.status(404).json({
        success: false,
        message: 'FIR not found'
      });
    }

    // Check if FIR is active
    if (!fir.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update disposal for inactive FIR'
      });
    }

    // Validate disposal date
    const disposalDate = new Date(dateOfDisposal);
    const filingDate = new Date(fir.filingDate);

    if (disposalDate < filingDate) {
      return res.status(400).json({
        success: false,
        message: 'Disposal date cannot be before filing date'
      });
    }

    // Update the FIR disposal status
    const updatedFIR = await FIR.findByIdAndUpdate(
      firId,
      {
        disposalStatus: status,
        disposalDate: disposalDate
      },
      { 
        new: true, 
        runValidators: false // Skip validators to avoid conflicts
      }
    )
    .populate('policeStationId', 'name code subdivision')
    .populate('createdBy', 'username role')
    .populate('assignedTo', 'username role');

    // Return success response
    res.status(200).json({
      success: true,
      message: `FIR ${status.toLowerCase()} successfully`,
      data: updatedFIR
    });

  } catch (error) {
    console.error('Error updating FIR disposal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating FIR disposal'
    });
  }
};

/**
 * Get performance report
 * @route GET /api/performance-report
 * @access Private (Admin only)
 */
const getPerformanceReport = async (req, res) => {
  try {
    // Simple performance report for now
    const totalFIRs = await FIR.countDocuments({ isActive: true });
    const registeredFIRs = await FIR.countDocuments({ disposalStatus: 'Registered', isActive: true });
    const chargesheetedFIRs = await FIR.countDocuments({ disposalStatus: 'Chargesheeted', isActive: true });
    const finalizedFIRs = await FIR.countDocuments({ disposalStatus: 'Finalized', isActive: true });

    const report = {
      totalFIRs,
      registeredFIRs,
      chargesheetedFIRs,
      finalizedFIRs,
      completionRate: totalFIRs > 0 ? Math.round(((chargesheetedFIRs + finalizedFIRs) / totalFIRs) * 100) : 0
    };

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating performance report'
    });
  }
};

module.exports = {
  updateFIRDisposal,
  getPerformanceReport
};
