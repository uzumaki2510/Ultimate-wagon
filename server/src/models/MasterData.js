const mongoose = require('mongoose');

const masterDataSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'WAGON_TYPE',
      'ZONE',
      'WORKSHOP',
      'DEPARTMENT',
      'DEFECT',
      'INSPECTION_TYPE',
      'WORKSHOP_LINE',
      'ROLE'
    ]
  },
  value: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MasterData', masterDataSchema);
