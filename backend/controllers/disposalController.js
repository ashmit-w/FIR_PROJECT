const FIR = require('../models/FIR.model');
const PoliceStation = require('../models/PoliceStation.model');
const mongoose = require('mongoose');

// @desc    Update FIR disposal status
// @route   PATCH /api/firs/:id/disposal
// @access  Private
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

    // Validate status
    if (!['Chargesheeted', 'Finalized'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Chargesheeted" or "Finalized"'
      });
    }

    // Validate date
    const disposalDate = new Date(dateOfDisposal);
    if (isNaN(disposalDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid disposal date'
      });
    }

    // Find the FIR
    const fir = await FIR.findById(firId);
    if (!fir) {
      return res.status(404).json({
        success: false,
        message: 'FIR not found'
      });
    }

    // Extract subdivision name from FIR police station for role-based access control
    let firSubdivisionName = fir.policeStation;
    if (fir.policeStation.includes(' (')) {
      firSubdivisionName = fir.policeStation.split(' (')[0];
    }

    // Check if user has permission to update this FIR
    if (req.user.role === 'ps' && firSubdivisionName !== req.user.police_station) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only update FIRs for your police station'
      });
    }

    if (req.user.role === 'sdpo' && !req.user.subdivision_stations.includes(firSubdivisionName)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only update FIRs for stations in your subdivision'
      });
    }

    // Check if FIR is already disposed
    if (fir.disposalStatus !== 'Registered') {
      return res.status(400).json({
        success: false,
        message: `FIR is already ${fir.disposalStatus.toLowerCase()}`
      });
    }

    // Update the FIR
    const updatedFIR = await FIR.findByIdAndUpdate(
      firId,
      {
        disposalStatus: status,
        disposalDate: disposalDate,
        status: status === 'Finalized' ? 'closed' : 'active'
      },
      { new: true, runValidators: true }
    ).populate('policeStationId', 'name code')
     .populate('createdBy', 'username role')
     .populate('assignedTo', 'username role');

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

// @desc    Get performance report
// @route   GET /api/firs/performance-report
// @access  Private (Admin/SDPO only)
const getPerformanceReport = async (req, res) => {
  try {
    // Check if user has permission to view performance report
    if (!['admin', 'sdpo'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Only Admin and SDPO can view performance reports'
      });
    }

    // Get all undisposed FIRs
    const undisposedFIRs = await FIR.find({ disposalStatus: 'Registered' })
      .populate('policeStationId', 'name code subdivision')
      .lean();

    // Calculate urgency categories
    const urgencyCategories = {
      'Green': 0,
      'Yellow': 0,
      'Orange': 0,
      'Red': 0,
      'Red+ (Overdue)': 0
    };

    const now = new Date();
    undisposedFIRs.forEach(fir => {
      const daysRemaining = Math.ceil((fir.disposalDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) {
        urgencyCategories['Red+ (Overdue)']++;
      } else if (daysRemaining <= 5) {
        urgencyCategories['Red']++;
      } else if (daysRemaining <= 10) {
        urgencyCategories['Orange']++;
      } else if (daysRemaining <= 15) {
        urgencyCategories['Yellow']++;
      } else {
        urgencyCategories['Green']++;
      }
    });

    // Get all police stations
    const policeStations = await PoliceStation.find({ isActive: true }).lean();

    // Calculate performance for each police station
    const stationPerformance = await Promise.all(
      policeStations.map(async (station) => {
        // Get FIRs for this station
        const stationFIRs = await FIR.find({ 
          policeStationId: station._id,
          disposalStatus: 'Registered'
        }).lean();

        // Get chargesheeted FIRs within due date
        const chargesheetedWithinDueDate = await FIR.find({
          policeStationId: station._id,
          disposalStatus: 'Chargesheeted',
          disposalDate: { $lte: new Date() } // disposal date should be today or earlier
        }).lean();

        // Calculate performance percentage
        const totalUndisposed = stationFIRs.length;
        const totalChargesheeted = chargesheetedWithinDueDate.length;
        
        let performancePercentage = 0;
        if (totalUndisposed > 0) {
          performancePercentage = Math.round((totalChargesheeted / totalUndisposed) * 100);
        }

        // Count FIRs by urgency for this station
        const stationUrgencyCounts = {
          'Green': 0,
          'Yellow': 0,
          'Orange': 0,
          'Red': 0,
          'Red+ (Overdue)': 0
        };

        stationFIRs.forEach(fir => {
          const daysRemaining = Math.ceil((fir.disposalDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining < 0) {
            stationUrgencyCounts['Red+ (Overdue)']++;
          } else if (daysRemaining <= 5) {
            stationUrgencyCounts['Red']++;
          } else if (daysRemaining <= 10) {
            stationUrgencyCounts['Orange']++;
          } else if (daysRemaining <= 15) {
            stationUrgencyCounts['Yellow']++;
          } else {
            stationUrgencyCounts['Green']++;
          }
        });

        return {
          stationId: station._id,
          stationName: station.name,
          stationCode: station.code,
          subdivision: station.subdivision,
          totalUndisposedFIRs: totalUndisposed,
          totalChargesheetedFIRs: totalChargesheeted,
          performancePercentage: performancePercentage,
          urgencyCounts: stationUrgencyCounts
        };
      })
    );

    // Sort stations by performance percentage (lowest first)
    stationPerformance.sort((a, b) => a.performancePercentage - b.performancePercentage);

    res.status(200).json({
      success: true,
      data: {
        urgencyCategories: urgencyCategories,
        stationPerformance: stationPerformance,
        summary: {
          totalUndisposedFIRs: undisposedFIRs.length,
          totalPoliceStations: policeStations.length,
          averagePerformance: stationPerformance.length > 0 
            ? Math.round(stationPerformance.reduce((sum, station) => sum + station.performancePercentage, 0) / stationPerformance.length)
            : 0
        }
      }
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
