const FIR = require('../models/FIR.model');
const PoliceStation = require('../models/PoliceStation.model');
const { 
  asyncHandler, 
  validateRequired, 
  validateEnum, 
  checkUnique, 
  findByIdOrFail, 
  sendSuccess, 
  sendError,
  paginate 
} = require('../utils/errorHandler');

// Police station hierarchy data (matching frontend constants + actual DB stations)
const POLICE_STATION_HIERARCHY = [
  {
    label: "North District",
    value: "north_district",
    subdivisions: [
      {
        label: "Panaji",
        value: "panaji_sd",
        stations: ["PANAJI PS", "OLD GOA PS", "AGACAIM PS"]
      },
      {
        label: "Mapusa",
        value: "mapusa_sd",
        stations: ["MAPUSA PS", "ANJUNA PS", "COLVALE PS"]
      },
      {
        label: "Bicholim",
        value: "bicholim_sd",
        stations: ["BICHOLIM PS", "VALPOI PS"]
      },
      {
        label: "Pernem",
        value: "pernem_sd",
        stations: ["PERNEM PS", "MANDREM PS", "MOPA PS"]
      },
      {
        label: "Porvorim",
        value: "porvorim_sd",
        stations: ["PORVORIM PS", "CALANGUTE PS", "SALIGAO PS"]
      }
    ]
  },
  {
    label: "South District",
    value: "south_district",
    subdivisions: [
      {
        label: "Margao",
        value: "margao_sd",
        stations: ["MARGAO TOWN PS", "MAINA CURTORIM PS", "FATORDA PS", "COLVA PS", "CUNCOLIM PS"]
      },
      {
        label: "Quepem",
        value: "quepem_sd",
        stations: ["QUEPEM PS", "SANGUEM PS", "CURCHOREM PS"]
      },
      {
        label: "Vasco",
        value: "vasco_sd",
        stations: ["VASCO PS", "VERNA PS", "DABOLIM AIRPORT PS", "MORMUGAO PS", "VASCO RAILWAY PS"]
      },
      {
        label: "Ponda",
        value: "ponda_sd",
        stations: ["PONDA PS", "MARDOL PS", "COLLEM PS"]
      }
    ]
  }
];

// Helper functions for hierarchical filtering
const getStationsByDistrict = (districtValue) => {
  const district = POLICE_STATION_HIERARCHY.find(dist => dist.value === districtValue);
  if (!district) return [];
  return district.subdivisions.flatMap(sub => sub.stations);
};

const getStationsBySubdivision = (subdivisionValue) => {
  const subdivision = POLICE_STATION_HIERARCHY
    .flatMap(district => district.subdivisions)
    .find(sub => sub.value === subdivisionValue);
  return subdivision ? subdivision.stations : [];
};

// @desc    Get all FIRs
// @route   GET /api/firs
// @access  Private
const getAllFIRs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, policeStation, status, urgency, sortBy = 'filingDate', sortOrder = 'desc' } = req.query;
  
  // Build filter object
  const filter = { isActive: true };
  
  // Handle police station filtering (including hierarchical)
  if (policeStation) {
    // Support hierarchical filtering
    if (policeStation.includes('_district')) {
      // Filter by district - need to get all stations in that district
      const districtStations = getStationsByDistrict(policeStation);
      filter.$or = [
        { policeStationOfRegistration: { $in: districtStations } },
        { assignedPoliceStation: { $in: districtStations } },
        { policeStation: { $in: districtStations } } // Backward compatibility
      ];
    } else if (policeStation.includes('_sd')) {
      // Filter by subdivision - need to get all stations in that subdivision
      const subdivisionStations = getStationsBySubdivision(policeStation);
      filter.$or = [
        { policeStationOfRegistration: { $in: subdivisionStations } },
        { assignedPoliceStation: { $in: subdivisionStations } },
        { policeStation: { $in: subdivisionStations } } // Backward compatibility
      ];
    } else {
      // Filter by specific station
      filter.$or = [
        { policeStationOfRegistration: policeStation },
        { assignedPoliceStation: policeStation },
        { policeStation: policeStation } // Backward compatibility
      ];
    }
  } else {
    // Role-based filtering (only if no specific police station filter)
    if (req.user.role === 'ps') {
      filter.policeStation = req.user.police_station;
    } else if (req.user.role === 'sdpo') {
      filter.policeStation = { $in: req.user.subdivision_stations };
    }
    // Admin sees all FIRs (no additional filter)
  }
  if (status) {
    validateEnum(status, ['Registered', 'Chargesheeted', 'Finalized'], 'Status');
    filter.disposalStatus = status;
  }
  
  // Urgency filtering
  if (urgency) {
    const urgencyFilters = {
      'safe': { $gt: 15 }, // More than 15 days left
      'yellow': { $gte: 10, $lte: 15 }, // 10-15 days left
      'orange': { $gte: 5, $lt: 10 }, // 5-9 days left
      'red': { $gt: 0, $lt: 5 }, // 1-4 days left
      'exceeded': { $lte: 0 }, // Exceeded limit
      'yellow+': { $lte: 15 }, // Yellow or higher urgency
      'orange+': { $lte: 9 }, // Orange or higher urgency
      'red+': { $lte: 4 } // Red or higher urgency
    };
    
    if (urgencyFilters[urgency]) {
      // We need to calculate days remaining in aggregation
      filter._urgencyFilter = urgencyFilters[urgency];
    }
  }
  
  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  let query;
  
  // If urgency filtering is needed OR we have hierarchical police station filtering, use aggregation
  if (filter._urgencyFilter || filter.$or) {
    const urgencyFilter = filter._urgencyFilter;
    delete filter._urgencyFilter; // Remove the temporary filter
    
    const pipeline = [
      { $match: filter }
    ];
    
    // Add urgency calculation and filtering if needed
    if (urgencyFilter) {
      pipeline.push(
        {
          $addFields: {
            daysRemaining: {
              $ceil: {
                $divide: [
                  { $subtract: ['$disposalDueDate', new Date()] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        },
        { $match: { daysRemaining: urgencyFilter } }
      );
    }
    
    // Add lookup stages
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'assignedTo'
        }
      },
      {
        $lookup: {
          from: 'policestations',
          localField: 'policeStationId',
          foreignField: '_id',
          as: 'policeStationId'
        }
      },
      {
        $addFields: {
          createdBy: { $arrayElemAt: ['$createdBy', 0] },
          assignedTo: { $arrayElemAt: ['$assignedTo', 0] },
          policeStationId: { $arrayElemAt: ['$policeStationId', 0] }
        }
      },
      { $sort: sort }
    );
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await FIR.aggregate([...pipeline, { $count: 'total' }]);
    const firs = await FIR.aggregate([...pipeline, { $skip: skip }, { $limit: parseInt(limit) }]);
    
    return res.status(200).json({
      success: true,
      data: firs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((totalCount[0]?.total || 0) / parseInt(limit)),
        totalItems: totalCount[0]?.total || 0,
        itemsPerPage: parseInt(limit)
      }
    });
  } else {
    // Regular query without urgency filtering
    query = FIR.find(filter)
      .populate('createdBy', 'username role')
      .populate('assignedTo', 'username role')
      .populate('policeStationId', 'name code subdivision')
      .sort(sort);
    
    const { query: paginatedQuery, pagination } = paginate(query, page, limit);
    const firs = await paginatedQuery.exec();
    const total = await FIR.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: firs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  }
});

// @desc    Get single FIR
// @route   GET /api/firs/:id
// @access  Private
const getFIR = async (req, res) => {
  try {
    const fir = await FIR.findById(req.params.id)
      .populate('createdBy', 'username role')
      .populate('assignedTo', 'username role')
      .populate('remarks.addedBy', 'username role');
    
    if (!fir) {
      return res.status(404).json({
        success: false,
        message: 'FIR not found'
      });
    }
    
    // Check if user has access to this FIR
    if (req.user.role === 'ps' && fir.policeStation !== req.user.police_station) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (req.user.role === 'sdpo' && !req.user.subdivision_stations.includes(fir.policeStation)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: fir
    });
  } catch (error) {
    console.error('Error fetching FIR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching FIR'
    });
  }
};

// Helper function to find police station by name (handles different formats)
const findPoliceStation = async (policeStationName) => {
  console.log('Looking up police station:', policeStationName);
  
  // Try exact match first
  let policeStationDoc = await PoliceStation.findOne({ name: policeStationName });
  console.log('Exact match result:', policeStationDoc ? policeStationDoc.name : 'NOT FOUND');
  
  if (!policeStationDoc) {
    // Try extracting station name from format "Station (Division)"
    if (policeStationName.includes(' (')) {
      const stationName = policeStationName.split(' (')[0].toUpperCase();
      console.log('Trying extracted name:', stationName);
      policeStationDoc = await PoliceStation.findOne({ name: stationName });
      console.log('Extracted name result:', policeStationDoc ? policeStationDoc.name : 'NOT FOUND');
    }
  }
  
  if (!policeStationDoc) {
    // Try case-insensitive search
    policeStationDoc = await PoliceStation.findOne({ 
      name: { $regex: new RegExp(`^${policeStationName}$`, 'i') } 
    });
    console.log('Case-insensitive result:', policeStationDoc ? policeStationDoc.name : 'NOT FOUND');
  }
  
  return policeStationDoc;
};

// @desc    Create new FIR
// @route   POST /api/firs
// @access  Private
const createFIR = async (req, res) => {
  try {
    const { firNumber, sections, policeStation, filingDate, seriousnessDays, status, disposalDate } = req.body;
    
    // Validate required fields
    if (!firNumber || !sections || !policeStation || !filingDate || !seriousnessDays) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    // Check if FIR number already exists
    const existingFIR = await FIR.findOne({ firNumber });
    if (existingFIR) {
      return res.status(400).json({
        success: false,
        message: 'FIR Number already exists'
      });
    }
    
    // Validate sections
    if (!Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one section is required'
      });
    }
    
    // Validate each section
    for (const section of sections) {
      if (!section.act || !section.section) {
        return res.status(400).json({
          success: false,
          message: 'Each section must have both act and section'
        });
      }
    }
    
    // Find the police station using helper function
    const policeStationDoc = await findPoliceStation(policeStation);
    if (!policeStationDoc) {
      // Get available stations for better error message
      const availableStations = await PoliceStation.find({ isActive: true }).select('name').lean();
      const stationNames = availableStations.map(s => s.name).join(', ');
      
      return res.status(400).json({
        success: false,
        message: `Police station not found: ${policeStation}. Available stations: ${stationNames}`
      });
    }
    
    const fir = await FIR.create({
      firNumber,
      sections,
      policeStation: policeStationDoc.name, // Use the actual database name
      policeStationId: policeStationDoc._id,
      filingDate: new Date(filingDate),
      seriousnessDays,
      disposalStatus: status || 'Registered',
      disposalDate: disposalDate ? new Date(disposalDate) : null,
      createdBy: req.user.id,
      assignedTo: req.user.id
    });
    
    const populatedFIR = await FIR.findById(fir._id)
      .populate('createdBy', 'username role')
      .populate('assignedTo', 'username role')
      .populate('policeStationId', 'name code subdivision');
    
    res.status(201).json({
      success: true,
      message: 'FIR created successfully',
      data: populatedFIR
    });
  } catch (error) {
    console.error('Error creating FIR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating FIR'
    });
  }
};

// @desc    Update FIR
// @route   PUT /api/firs/:id
// @access  Private
const updateFIR = async (req, res) => {
  try {
    const { firNumber, sections, policeStation, filingDate, seriousnessDays, status, disposalDate } = req.body;
    
    const fir = await FIR.findById(req.params.id);
    if (!fir) {
      return res.status(404).json({
        success: false,
        message: 'FIR not found'
      });
    }
    
    // Extract subdivision name for role-based access control
    let firSubdivisionName = fir.policeStation;
    if (fir.policeStation.includes(' (')) {
      firSubdivisionName = fir.policeStation.split(' (')[0];
    }
    
    // Check if user has permission to update this FIR
    if (req.user.role === 'ps' && firSubdivisionName !== req.user.police_station) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (req.user.role === 'sdpo' && !req.user.subdivision_stations.includes(firSubdivisionName)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if FIR number is being changed and if it already exists
    if (firNumber && firNumber !== fir.firNumber) {
      const existingFIR = await FIR.findOne({ firNumber });
      if (existingFIR) {
        return res.status(400).json({
          success: false,
          message: 'FIR Number already exists'
        });
      }
    }
    
    // Handle police station update if provided
    let updateData = {
      ...(firNumber && { firNumber }),
      ...(sections && { sections }),
      ...(policeStation && { policeStation }),
      ...(filingDate && { filingDate: new Date(filingDate) }),
      ...(seriousnessDays && { seriousnessDays }),
      ...(status && { disposalStatus: status }),
      ...(disposalDate && { disposalDate: new Date(disposalDate) })
    };
    
    // If police station is being updated, find the new police station ID
    if (policeStation) {
      const policeStationDoc = await findPoliceStation(policeStation);
      if (!policeStationDoc) {
        return res.status(400).json({
          success: false,
          message: `Police station not found: ${policeStation}`
        });
      }
      updateData.policeStation = policeStationDoc.name;
      updateData.policeStationId = policeStationDoc._id;
    }
    
    const updatedFIR = await FIR.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username role')
     .populate('assignedTo', 'username role')
     .populate('policeStationId', 'name code subdivision');
    
    res.status(200).json({
      success: true,
      message: 'FIR updated successfully',
      data: updatedFIR
    });
  } catch (error) {
    console.error('Error updating FIR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating FIR'
    });
  }
};

// @desc    Delete FIR
// @route   DELETE /api/firs/:id
// @access  Private (Admin only)
const deleteFIR = async (req, res) => {
  try {
    const fir = await FIR.findById(req.params.id);
    if (!fir) {
      return res.status(404).json({
        success: false,
        message: 'FIR not found'
      });
    }
    
    // Only admin can delete FIRs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete FIRs'
      });
    }
    
    await FIR.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'FIR deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FIR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting FIR'
    });
  }
};

// @desc    Add remark to FIR
// @route   POST /api/firs/:id/remarks
// @access  Private
const addRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    
    if (!remark) {
      return res.status(400).json({
        success: false,
        message: 'Remark is required'
      });
    }
    
    const fir = await FIR.findById(req.params.id);
    if (!fir) {
      return res.status(404).json({
        success: false,
        message: 'FIR not found'
      });
    }
    
    // Check if user has permission to add remarks
    if (req.user.role === 'ps' && fir.policeStation !== req.user.police_station) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (req.user.role === 'sdpo' && !req.user.subdivision_stations.includes(fir.policeStation)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    fir.remarks.push({
      remark,
      addedBy: req.user.id
    });
    
    await fir.save();
    
    const updatedFIR = await FIR.findById(fir._id)
      .populate('createdBy', 'username role')
      .populate('assignedTo', 'username role')
      .populate('remarks.addedBy', 'username role');
    
    res.status(200).json({
      success: true,
      message: 'Remark added successfully',
      data: updatedFIR
    });
  } catch (error) {
    console.error('Error adding remark:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding remark'
    });
  }
};

module.exports = {
  getAllFIRs,
  getFIR,
  createFIR,
  updateFIR,
  deleteFIR,
  addRemark
};