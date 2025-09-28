const FIR = require('../models/FIR.model');
const PoliceStation = require('../models/PoliceStation.model');
const mongoose = require('mongoose');

// @desc    Get all FIRs
// @route   GET /api/firs
// @access  Private
const getAllFIRs = async (req, res) => {
  try {
    const { page = 1, limit = 10, policeStation, status, sortBy = 'filingDate', sortOrder = 'desc' } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Filter by police station if user is PS role
    if (req.user.role === 'ps') {
      filter.policeStation = req.user.police_station;
    } else if (req.user.role === 'sdpo') {
      // SDPO can see FIRs from their subdivision stations
      filter.policeStation = { $in: req.user.subdivision_stations };
    }
    
    // Additional filters
    if (policeStation) {
      filter.policeStation = policeStation;
    }
    if (status) {
      filter.status = status;
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const firs = await FIR.find(filter)
      .populate('createdBy', 'username role')
      .populate('assignedTo', 'username role')
      .populate('policeStationId', 'name code subdivision')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
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
  } catch (error) {
    console.error('Error fetching FIRs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching FIRs'
    });
  }
};

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

// @desc    Create new FIR
// @route   POST /api/firs
// @access  Private
const createFIR = async (req, res) => {
  try {
    const { firNumber, sections, policeStation, filingDate, seriousnessDays, description } = req.body;
    
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
    
    // Extract subdivision name for role-based access control and police station lookup
    let subdivisionName = policeStation;
    if (policeStation.includes(' (')) {
      subdivisionName = policeStation.split(' (')[0];
    }
    
    // Check if user has permission to create FIR for this police station
    if (req.user.role === 'ps' && subdivisionName !== req.user.police_station) {
      return res.status(403).json({
        success: false,
        message: 'You can only create FIRs for your police station'
      });
    }
    
    if (req.user.role === 'sdpo' && !req.user.subdivision_stations.includes(subdivisionName)) {
      return res.status(403).json({
        success: false,
        message: 'You can only create FIRs for stations in your subdivision'
      });
    }
    
    // Find the police station by subdivision name to get the ID
    // Look for police stations that contain the subdivision name
    const policeStationDoc = await PoliceStation.findOne({ 
      $or: [
        { name: subdivisionName },
        { name: { $regex: new RegExp(subdivisionName, 'i') } },
        { subdivision: subdivisionName }
      ]
    });
    if (!policeStationDoc) {
      return res.status(400).json({
        success: false,
        message: 'Police station not found'
      });
    }
    
    const fir = await FIR.create({
      firNumber,
      sections,
      policeStation,
      policeStationId: policeStationDoc._id,
      filingDate: new Date(filingDate),
      seriousnessDays,
      description,
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
    const { firNumber, sections, policeStation, filingDate, seriousnessDays, description, status } = req.body;
    
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
      ...(description !== undefined && { description }),
      ...(status && { status })
    };
    
    // If police station is being updated, find the new police station ID
    if (policeStation) {
      let subdivisionName = policeStation;
      if (policeStation.includes(' (')) {
        subdivisionName = policeStation.split(' (')[0];
      }
      
      const policeStationDoc = await PoliceStation.findOne({ 
        $or: [
          { name: subdivisionName },
          { name: { $regex: new RegExp(subdivisionName, 'i') } },
          { subdivision: subdivisionName }
        ]
      });
      if (!policeStationDoc) {
        return res.status(400).json({
          success: false,
          message: 'Police station not found'
        });
      }
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
