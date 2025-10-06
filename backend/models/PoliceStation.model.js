const mongoose = require('mongoose');

// Enhanced Police Station Schema with better validation
const policeStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Police Station name is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  code: {
    type: String,
    required: [true, 'Police Station code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]+$/, 'Code can only contain letters and numbers']
  },
  subdivision: {
    type: String,
    required: [true, 'Subdivision is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
    enum: ['North District', 'South District', 'Special Unit']
  },
  state: {
    type: String,
    default: 'Goa',
    trim: true
  },
  contact: {
    type: String,
    trim: true,
    match: [/^[0-9\-\+\(\)\s]+$/, 'Contact can only contain numbers, spaces, and common phone symbols']
  },
  inCharge: {
    type: String,
    trim: true,
    maxlength: [100, 'In Charge name cannot exceed 100 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  jurisdiction: {
    type: String,
    trim: true,
    maxlength: [1000, 'Jurisdiction cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  establishedDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
// policeStationSchema.index({ name: 1 }); // REMOVED - name already has unique: true
// policeStationSchema.index({ code: 1 }); // REMOVED - code already has unique: true
policeStationSchema.index({ subdivision: 1 });
policeStationSchema.index({ district: 1 });
policeStationSchema.index({ isActive: 1 });

// Compound indexes for common queries
policeStationSchema.index({ district: 1, subdivision: 1 });
policeStationSchema.index({ subdivision: 1, isActive: 1 });

// Virtual for full name
policeStationSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.subdivision})`;
});

// Virtual for district color
policeStationSchema.virtual('districtColor').get(function() {
  const colors = {
    'North District': 'blue',
    'South District': 'green',
    'Special Unit': 'purple'
  };
  return colors[this.district] || 'gray';
});

// Static method to get stations by district
policeStationSchema.statics.getByDistrict = function(district) {
  return this.find({ district, isActive: true }).sort({ subdivision: 1, name: 1 });
};

// Static method to get stations by subdivision
policeStationSchema.statics.getBySubdivision = function(subdivision) {
  return this.find({ subdivision, isActive: true }).sort({ name: 1 });
};

// Static method to get all subdivisions
policeStationSchema.statics.getSubdivisions = function() {
  return this.distinct('subdivision', { isActive: true }).sort();
};

// Static method to get all districts
policeStationSchema.statics.getDistricts = function() {
  return this.distinct('district', { isActive: true }).sort();
};

module.exports = mongoose.model('PoliceStation', policeStationSchema);