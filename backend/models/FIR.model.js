const mongoose = require('mongoose');

const FIRSchema = new mongoose.Schema({
  firNumber: {
    type: String,
    required: [true, 'FIR Number is required'],
    unique: true,
    trim: true,
  },
  sections: [{
    act: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    }
  }],
  policeStation: {
    type: String,
    required: [true, 'Police Station is required'],
    trim: true,
  },
  policeStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoliceStation',
    required: [true, 'Police Station ID is required'],
  },
  filingDate: {
    type: Date,
    required: [true, 'Filing Date is required'],
  },
  seriousnessDays: {
    type: Number,
    required: [true, 'Seriousness Days is required'],
    enum: [60, 90, 180],
    default: 60,
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'pending'],
    default: 'active',
  },
  disposalStatus: {
    type: String,
    enum: ['Registered', 'Chargesheeted', 'Finalized'],
    default: 'Registered',
  },
  disposalDate: {
    type: Date,
    default: null,
  },
  disposalDueDate: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  description: {
    type: String,
    trim: true,
  },
  remarks: [{
    remark: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    }
  }]
}, {
  timestamps: true,
});

// Index for better query performance
FIRSchema.index({ firNumber: 1 });
FIRSchema.index({ policeStation: 1 });
FIRSchema.index({ policeStationId: 1 });
FIRSchema.index({ filingDate: 1 });
FIRSchema.index({ createdBy: 1 });
FIRSchema.index({ disposalStatus: 1 });
FIRSchema.index({ disposalDueDate: 1 });

// Pre-save middleware to calculate disposalDueDate
FIRSchema.pre('save', function(next) {
  if (this.isNew && !this.disposalDueDate) {
    // Set disposal due date to 90 days after filing date
    const dueDate = new Date(this.filingDate);
    dueDate.setDate(dueDate.getDate() + 90);
    this.disposalDueDate = dueDate;
  }
  next();
});

// Virtual for deadline calculation
FIRSchema.virtual('deadline').get(function() {
  const deadline = new Date(this.filingDate);
  deadline.setDate(deadline.getDate() + this.seriousnessDays);
  return deadline;
});

// Virtual for days remaining (based on disposal due date)
FIRSchema.virtual('daysRemaining').get(function() {
  if (!this.disposalDueDate) {
    // Fallback to old calculation if disposalDueDate is not set
    const deadline = new Date(this.filingDate);
    deadline.setDate(deadline.getDate() + this.seriousnessDays);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const now = new Date();
  const diffTime = this.disposalDueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for disposal urgency status
FIRSchema.virtual('disposalUrgencyStatus').get(function() {
  const daysRemaining = this.daysRemaining;
  if (daysRemaining < 0) return 'Red+ (Overdue)';
  if (daysRemaining <= 5) return 'Red';
  if (daysRemaining <= 10) return 'Orange';
  if (daysRemaining <= 15) return 'Yellow';
  return 'Green';
});

// Virtual for status based on deadline (legacy support)
FIRSchema.virtual('urgencyStatus').get(function() {
  const daysRemaining = this.daysRemaining;
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= this.seriousnessDays * 0.25) return 'critical';
  if (daysRemaining <= this.seriousnessDays * 0.5) return 'warning';
  return 'safe';
});

// Ensure virtual fields are included in JSON output
FIRSchema.set('toJSON', { virtuals: true });
FIRSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FIR', FIRSchema);
