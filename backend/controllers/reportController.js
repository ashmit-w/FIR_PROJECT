const FIR = require('../models/FIR.model');
const PoliceStation = require('../models/PoliceStation.model');
const User = require('../models/User.model');
const mongoose = require('mongoose');

/**
 * Generate comprehensive performance report
 * @route GET /api/reports/performance
 * @access Private (Admin/SDPO only)
 */
const generatePerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, policeStationId } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.filingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Build police station filter
    const stationFilter = {};
    if (policeStationId && policeStationId !== 'all') {
      stationFilter.policeStationId = new mongoose.Types.ObjectId(policeStationId);
    }

    // Combine filters
    const baseFilter = {
      isActive: true,
      ...dateFilter,
      ...stationFilter
    };

    // Get basic counts
    const [
      totalFIRs,
      registeredFIRs,
      chargesheetedFIRs,
      finalizedFIRs,
      overdueFIRs,
      policeStations,
      recentFIRs
    ] = await Promise.all([
      FIR.countDocuments(baseFilter),
      FIR.countDocuments({ ...baseFilter, disposalStatus: 'Registered' }),
      FIR.countDocuments({ ...baseFilter, disposalStatus: 'Chargesheeted' }),
      FIR.countDocuments({ ...baseFilter, disposalStatus: 'Finalized' }),
      FIR.countDocuments({
        ...baseFilter,
        disposalStatus: { $in: ['Registered', 'Chargesheeted'] },
        disposalDueDate: { $lt: new Date() }
      }),
      PoliceStation.find({ isActive: true }).select('name code subdivision').lean(),
      FIR.find(baseFilter)
        .populate('policeStationId', 'name code subdivision')
        .populate('createdBy', 'username role')
        .sort({ filingDate: -1 })
        .limit(10)
        .lean()
    ]);

    // Calculate performance metrics
    const completionRate = totalFIRs > 0 ? Math.round(((chargesheetedFIRs + finalizedFIRs) / totalFIRs) * 100) : 0;
    const overdueRate = totalFIRs > 0 ? Math.round((overdueFIRs / totalFIRs) * 100) : 0;

    // Get police station wise performance
    const stationPerformance = await PoliceStation.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'firs',
          localField: '_id',
          foreignField: 'policeStationId',
          as: 'firs',
          pipeline: [
            { $match: baseFilter }
          ]
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          subdivision: 1,
          totalFIRs: { $size: '$firs' },
          registeredFIRs: {
            $size: {
              $filter: {
                input: '$firs',
                cond: { $eq: ['$$this.disposalStatus', 'Registered'] }
              }
            }
          },
          chargesheetedFIRs: {
            $size: {
              $filter: {
                input: '$firs',
                cond: { $eq: ['$$this.disposalStatus', 'Chargesheeted'] }
              }
            }
          },
          finalizedFIRs: {
            $size: {
              $filter: {
                input: '$firs',
                cond: { $eq: ['$$this.disposalStatus', 'Finalized'] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: {
              if: { $gt: ['$totalFIRs', 0] },
              then: {
                $round: {
                  $multiply: [
                    { $divide: [{ $add: ['$chargesheetedFIRs', '$finalizedFIRs'] }, '$totalFIRs'] },
                    100
                  ]
                }
              },
              else: 0
            }
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await FIR.aggregate([
      {
        $match: {
          ...baseFilter,
          filingDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$filingDate' },
            month: { $month: '$filingDate' }
          },
          totalFIRs: { $sum: 1 },
          registeredFIRs: {
            $sum: { $cond: [{ $eq: ['$disposalStatus', 'Registered'] }, 1, 0] }
          },
          chargesheetedFIRs: {
            $sum: { $cond: [{ $eq: ['$disposalStatus', 'Chargesheeted'] }, 1, 0] }
          },
          finalizedFIRs: {
            $sum: { $cond: [{ $eq: ['$disposalStatus', 'Finalized'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Generate report summary
    const reportSummary = {
      reportGeneratedAt: new Date().toISOString(),
      reportPeriod: {
        startDate: startDate || 'All Time',
        endDate: endDate || 'All Time'
      },
      overview: {
        totalFIRs,
        registeredFIRs,
        chargesheetedFIRs,
        finalizedFIRs,
        overdueFIRs,
        completionRate,
        overdueRate
      },
      policeStationPerformance: stationPerformance,
      monthlyTrends,
      recentFIRs: recentFIRs.map(fir => ({
        firNumber: fir.firNumber,
        filingDate: fir.filingDate,
        disposalStatus: fir.disposalStatus,
        policeStation: fir.policeStationId?.name || fir.policeStation,
        createdBy: fir.createdBy?.username || 'Unknown'
      })),
      availablePoliceStations: policeStations.map(station => ({
        id: station._id,
        name: station.name,
        code: station.code,
        subdivision: station.subdivision
      }))
    };

    res.status(200).json({
      success: true,
      message: 'Performance report generated successfully',
      data: reportSummary
    });

  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating performance report'
    });
  }
};

/**
 * Generate detailed FIR report
 * @route GET /api/reports/firs
 * @access Private (Admin/SDPO only)
 */
const generateFIRReport = async (req, res) => {
  try {
    const { startDate, endDate, policeStationId, disposalStatus, page = 1, limit = 50 } = req.query;
    
    // Build filters
    const filters = { isActive: true };
    
    if (startDate && endDate) {
      filters.filingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (policeStationId && policeStationId !== 'all') {
      filters.policeStationId = new mongoose.Types.ObjectId(policeStationId);
    }
    
    if (disposalStatus && disposalStatus !== 'all') {
      filters.disposalStatus = disposalStatus;
    }

    // Get paginated FIRs
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [firs, totalCount] = await Promise.all([
      FIR.find(filters)
        .populate('policeStationId', 'name code subdivision')
        .populate('createdBy', 'username role')
        .populate('assignedTo', 'username role')
        .sort({ filingDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FIR.countDocuments(filters)
    ]);

    // Format FIR data
    const formattedFIRs = firs.map(fir => ({
      _id: fir._id,
      firNumber: fir.firNumber,
      sections: fir.sections,
      policeStation: fir.policeStationId?.name || fir.policeStation,
      filingDate: fir.filingDate,
      disposalStatus: fir.disposalStatus,
      disposalDate: fir.disposalDate,
      disposalDueDate: fir.disposalDueDate,
      seriousnessDays: fir.seriousnessDays,
      createdBy: fir.createdBy?.username || 'Unknown',
      assignedTo: fir.assignedTo?.username || 'Unassigned',
      daysRemaining: fir.daysRemaining,
      disposalUrgencyStatus: fir.disposalUrgencyStatus,
      createdAt: fir.createdAt,
      updatedAt: fir.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'FIR report generated successfully',
      data: {
        firs: formattedFIRs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1
        },
        filters: {
          startDate,
          endDate,
          policeStationId,
          disposalStatus
        }
      }
    });

  } catch (error) {
    console.error('Error generating FIR report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating FIR report'
    });
  }
};

module.exports = {
  generatePerformanceReport,
  generateFIRReport
};
