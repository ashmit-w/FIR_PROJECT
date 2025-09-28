import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import FIR from '../../../../backend/models/FIR.model';
import PoliceStation from '../../../../backend/models/PoliceStation.model';

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mario:mario123@cluster0.a8og4qr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Database connection failed');
  }
};

// Helper function to calculate urgency category based on days remaining
const getUrgencyCategory = (daysRemaining: number): string => {
  if (daysRemaining < 0) return 'Red+'; // Overdue
  if (daysRemaining <= 5) return 'Red';
  if (daysRemaining <= 10) return 'Orange';
  if (daysRemaining <= 15) return 'Yellow';
  return 'Green';
};

// Helper function to calculate days remaining until disposal due date
const calculateDaysRemaining = (disposalDueDate: Date): number => {
  const today = new Date();
  const timeDiff = disposalDueDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const statusFilter = searchParams.get('statusFilter');
    const policeStationIds = searchParams.get('policeStationIds');

    // Build match conditions
    const matchConditions: any = {};

    // Date range filter
    if (startDate && endDate) {
      matchConditions.filingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Status filter
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim());
      matchConditions.disposalStatus = { $in: statuses };
    }

    // Police station IDs filter
    if (policeStationIds) {
      const stationIds = policeStationIds.split(',').map(id => id.trim());
      matchConditions.policeStationId = { $in: stationIds };
    }

    // High-performance Mongoose Aggregation Pipeline
    const aggregationPipeline = [
      // Stage 1: Match FIRs based on filters
      {
        $match: matchConditions
      },
      
      // Stage 2: Lookup police station information
      {
        $lookup: {
          from: 'policestations',
          localField: 'policeStationId',
          foreignField: '_id',
          as: 'policeStation'
        }
      },
      
      // Stage 3: Unwind police station data
      {
        $unwind: {
          path: '$policeStation',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Stage 4: Add calculated fields for urgency and performance
      {
        $addFields: {
          daysRemaining: {
            $cond: {
              if: { $ne: ['$disposalDueDate', null] },
              then: {
                $ceil: {
                  $divide: [
                    { $subtract: ['$disposalDueDate', '$$NOW'] },
                    1000 * 60 * 60 * 24
                  ]
                }
              },
              else: null
            }
          },
          urgencyCategory: {
            $cond: {
              if: { $ne: ['$disposalDueDate', null] },
              then: {
                $switch: {
                  branches: [
                    {
                      case: { $lt: [{ $divide: [{ $subtract: ['$disposalDueDate', '$$NOW'] }, 1000 * 60 * 60 * 24] }, 0] },
                      then: 'Red+'
                    },
                    {
                      case: { $lte: [{ $divide: [{ $subtract: ['$disposalDueDate', '$$NOW'] }, 1000 * 60 * 60 * 24] }, 5] },
                      then: 'Red'
                    },
                    {
                      case: { $lte: [{ $divide: [{ $subtract: ['$disposalDueDate', '$$NOW'] }, 1000 * 60 * 60 * 24] }, 10] },
                      then: 'Orange'
                    },
                    {
                      case: { $lte: [{ $divide: [{ $subtract: ['$disposalDueDate', '$$NOW'] }, 1000 * 60 * 60 * 24] }, 15] },
                      then: 'Yellow'
                    }
                  ],
                  default: 'Green'
                }
              },
              else: null
            }
          },
          isChargesheetedOnTime: {
            $and: [
              { $eq: ['$disposalStatus', 'Chargesheeted'] },
              { $ne: ['$disposalDate', null] },
              { $ne: ['$disposalDueDate', null] },
              { $lte: ['$disposalDate', '$disposalDueDate'] }
            ]
          }
        }
      },
      
      // Stage 5: Group by police station and calculate metrics
      {
        $group: {
          _id: '$policeStationId',
          policeStationName: { $first: '$policeStation.name' },
          policeStationCode: { $first: '$policeStation.code' },
          policeStationSubdivision: { $first: '$policeStation.subdivision' },
          
          // Total counts
          totalRegisteredCases: { $sum: 1 },
          totalChargesheeted: {
            $sum: { $cond: [{ $eq: ['$disposalStatus', 'Chargesheeted'] }, 1, 0] }
          },
          totalFinalized: {
            $sum: { $cond: [{ $eq: ['$disposalStatus', 'Finalized'] }, 1, 0] }
          },
          totalRegistered: {
            $sum: { $cond: [{ $eq: ['$disposalStatus', 'Registered'] }, 1, 0] }
          },
          
          // Urgency counts (for pending cases only)
          yellowCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$disposalStatus', 'Registered'] },
                    { $eq: ['$urgencyCategory', 'Yellow'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          orangeCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$disposalStatus', 'Registered'] },
                    { $eq: ['$urgencyCategory', 'Orange'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          redCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$disposalStatus', 'Registered'] },
                    { $eq: ['$urgencyCategory', 'Red'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          redPlusCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$disposalStatus', 'Registered'] },
                    { $eq: ['$urgencyCategory', 'Red+'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          greenCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$disposalStatus', 'Registered'] },
                    { $eq: ['$urgencyCategory', 'Green'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          
          // Performance metric: Chargesheeted on time
          chargesheetedOnTime: {
            $sum: { $cond: ['$isChargesheetedOnTime', 1, 0] }
          }
        }
      },
      
      // Stage 6: Calculate performance percentage
      {
        $addFields: {
          performancePercentage: {
            $cond: {
              if: { $gt: ['$totalRegisteredCases', 0] },
              then: {
                $multiply: [
                  { $divide: ['$chargesheetedOnTime', '$totalRegisteredCases'] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      
      // Stage 7: Project final structure
      {
        $project: {
          _id: 1,
          policeStationId: '$_id',
          policeStationName: 1,
          policeStationCode: 1,
          policeStationSubdivision: 1,
          
          // Total metrics
          totalRegisteredCases: 1,
          totalChargesheeted: 1,
          totalFinalized: 1,
          totalRegistered: 1,
          
          // Urgency counts
          urgencyCounts: {
            yellow: '$yellowCount',
            orange: '$orangeCount',
            red: '$redCount',
            redPlus: '$redPlusCount',
            green: '$greenCount'
          },
          
          // Performance metrics
          performancePercentage: { $round: ['$performancePercentage', 2] },
          chargesheetedOnTime: 1,
          
          // Additional calculated fields
          pendingCases: '$totalRegistered',
          disposedCases: { $add: ['$totalChargesheeted', '$totalFinalized'] },
          disposalRate: {
            $cond: {
              if: { $gt: ['$totalRegisteredCases', 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: [{ $add: ['$totalChargesheeted', '$totalFinalized'] }, '$totalRegisteredCases'] },
                      100
                    ]
                  },
                  2
                ]
              },
              else: 0
            }
          }
        }
      },
      
      // Stage 8: Sort by police station name
      {
        $sort: { policeStationName: 1 }
      }
    ];

    // Execute aggregation
    const results = await FIR.aggregate(aggregationPipeline);

    // Calculate summary statistics
    const summary = {
      totalPoliceStations: results.length,
      totalRegisteredCases: results.reduce((sum, ps) => sum + ps.totalRegisteredCases, 0),
      totalChargesheeted: results.reduce((sum, ps) => sum + ps.totalChargesheeted, 0),
      totalFinalized: results.reduce((sum, ps) => sum + ps.totalFinalized, 0),
      totalPending: results.reduce((sum, ps) => sum + ps.pendingCases, 0),
      averagePerformancePercentage: results.length > 0 
        ? results.reduce((sum, ps) => sum + ps.performancePercentage, 0) / results.length 
        : 0,
      urgencySummary: {
        yellow: results.reduce((sum, ps) => sum + ps.urgencyCounts.yellow, 0),
        orange: results.reduce((sum, ps) => sum + ps.urgencyCounts.orange, 0),
        red: results.reduce((sum, ps) => sum + ps.urgencyCounts.red, 0),
        redPlus: results.reduce((sum, ps) => sum + ps.urgencyCounts.redPlus, 0),
        green: results.reduce((sum, ps) => sum + ps.urgencyCounts.green, 0)
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        policeStations: results,
        summary,
        filters: {
          startDate,
          endDate,
          statusFilter,
          policeStationIds
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating PDF report data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate report data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
