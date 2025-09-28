const mongoose = require('mongoose');

const PoliceStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Police Station name is required'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Police Station code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  subdivision: {
    type: String,
    required: [true, 'Subdivision is required'],
    trim: true,
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    trim: true,
  },
  inCharge: {
    name: String,
    designation: String,
    contactNumber: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

// Index for better query performance
PoliceStationSchema.index({ name: 1 });
PoliceStationSchema.index({ code: 1 });
PoliceStationSchema.index({ subdivision: 1 });
PoliceStationSchema.index({ district: 1 });

module.exports = mongoose.model('PoliceStation', PoliceStationSchema);
