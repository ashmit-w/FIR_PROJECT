const mongoose = require('mongoose');

// Enhanced FIR Schema with better validation and consistency
const firSchema = new mongoose.Schema({
  firNumber: {
    type: String,
    required: [true, 'FIR Number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9\/\-]+$/, 'FIR Number can only contain letters, numbers, slashes, and hyphens']
  },
  sections: [{
    act: {
      type: String,
      required: [true, 'Act is required'],
      trim: true,
      uppercase: true
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true
    }
  }],
  policeStation: {
    type: String,
    required: [true, 'Police Station is required'],
    trim: true
  },
  policeStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoliceStation',
    required: [true, 'Police Station ID is required']
  },
  filingDate: {
    type: Date,
    required: [true, 'Filing Date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Filing date cannot be in the future'
    }
  },
  seriousnessDays: {
    type: Number,
    required: [true, 'Seriousness Days is required'],
    enum: [60, 90, 180],
    default: 90
  },
  disposalStatus: {
    type: String,
    enum: ['Registered', 'Chargesheeted', 'Finalized'],
    default: 'Registered'
  },
  disposalDate: {
    type: Date,
    default: null
  },
  disposalDueDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created By is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned To is required']
  },
  remarks: [{
    remark: {
      type: String,
      required: [true, 'Remark is required'],
      trim: true,
      maxlength: [500, 'Remark cannot exceed 500 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Added By is required']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
// firSchema.index({ firNumber: 1 }); // REMOVED - firNumber already has unique: true
firSchema.index({ policeStation: 1 });
firSchema.index({ policeStationId: 1 });
firSchema.index({ filingDate: 1 });
firSchema.index({ disposalStatus: 1 });
firSchema.index({ disposalDueDate: 1 });
firSchema.index({ createdBy: 1 });
firSchema.index({ assignedTo: 1 });
firSchema.index({ isActive: 1 });

// Compound indexes for common queries
firSchema.index({ policeStation: 1, disposalStatus: 1 });
firSchema.index({ filingDate: 1, disposalStatus: 1 });
firSchema.index({ disposalDueDate: 1, disposalStatus: 1 });

// Virtual for days remaining
firSchema.virtual('daysRemaining').get(function() {
  if (!this.disposalDueDate) return null;
  const today = new Date();
  const diffTime = this.disposalDueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for disposal urgency status
firSchema.virtual('disposalUrgencyStatus').get(function() {
  const days = this.daysRemaining;
  if (days === null) return 'Unknown';
  
  // New urgency metrics as requested
  if (days > 15) return 'Safe';
  if (days >= 10) return 'Yellow';
  if (days >= 5) return 'Orange';
  if (days > 0) return 'Red';
  return 'Exceeded'; // Cases that have exceeded the maximum limit
});

// Virtual for urgency status color
firSchema.virtual('urgencyStatusColor').get(function() {
  const colors = {
    'Safe': 'green',
    'Yellow': 'yellow',
    'Orange': 'orange',
    'Red': 'red',
    'Exceeded': 'darkred',
    'Unknown': 'gray'
  };
  return colors[this.disposalUrgencyStatus] || 'gray';
});

// Virtual for disposal status color
firSchema.virtual('disposalStatusColor').get(function() {
  const colors = {
    'Registered': 'blue',
    'Chargesheeted': 'green',
    'Finalized': 'purple'
  };
  return colors[this.disposalStatus] || 'gray';
});

// Pre-save middleware to calculate disposalDueDate
firSchema.pre('save', function(next) {
  if (this.isNew && this.filingDate && !this.disposalDueDate) {
    const dueDate = new Date(this.filingDate);
    dueDate.setDate(dueDate.getDate() + this.seriousnessDays);
    this.disposalDueDate = dueDate;
  }
  next();
});

// Pre-save middleware to validate disposal date
firSchema.pre('save', function(next) {
  if (this.disposalDate && this.disposalDate < this.filingDate) {
    return next(new Error('Disposal date cannot be before filing date'));
  }
  next();
});

// Static method to get FIRs by urgency
firSchema.statics.getByUrgency = function(urgency) {
  const today = new Date();
  const queries = {
    'Green': { disposalDueDate: { $gt: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000) } },
    'Yellow': { 
      disposalDueDate: { 
        $gt: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        $lte: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)
      }
    },
    'Orange': { 
      disposalDueDate: { 
        $gt: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        $lte: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)
      }
    },
    'Red': { 
      disposalDueDate: { 
        $gt: today,
        $lte: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
      }
    },
    'Red+': { disposalDueDate: { $lt: today } }
  };
  
  return this.find({ 
    ...queries[urgency], 
    disposalStatus: 'Registered',
    isActive: true 
  });
};

// Static method to get performance statistics
firSchema.statics.getPerformanceStats = function(policeStationId = null) {
  const matchStage = { isActive: true };
  if (policeStationId) {
    matchStage.policeStationId = policeStationId;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$disposalStatus',
        count: { $sum: 1 },
        avgDaysRemaining: { $avg: '$daysRemaining' }
      }
    }
  ]);
};

module.exports = mongoose.model('FIR', firSchema);