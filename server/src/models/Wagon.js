const mongoose = require('mongoose');
const { WAGON_TYPES, WAGON_CATEGORIES, WAGON_STATUSES, PRIORITY_LEVELS } = require('../utils/constants');

const repairTaskSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    subRepair: { type: String, required: true },
    severity: { type: String, enum: PRIORITY_LEVELS, default: 'Normal' },
  },
  { _id: false }
);

const wagonSchema = new mongoose.Schema(
  {
    wagonNo: {
      type: String,
      required: [true, 'Wagon number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Wagon type is required'],
      enum: { values: WAGON_TYPES, message: 'Invalid wagon type' },
    },
    owner: {
      type: String,
      required: [true, 'Owner/Railway zone is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: WAGON_CATEGORIES,
      default: 'Other',
    },
    builtYear: {
      type: Number,
      min: [1950, 'Built year too old'],
      max: [new Date().getFullYear() + 1, 'Built year cannot be in the future'],
    },
    status: {
      type: String,
      enum: { values: WAGON_STATUSES, message: 'Invalid wagon status' },
      default: 'In Service',
      index: true,
    },
    currentLocation: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: PRIORITY_LEVELS,
      default: 'Normal',
    },
    defect: {
      type: String,
      trim: true,
    },
    comments: {
      type: String,
      trim: true,
    },
    rakeId: {
      type: String,
      trim: true,
    },
    bookedTo: {
      type: String,
      trim: true,
    },
    lastROHDate: Date,
    lastPOHDate: Date,
    rohStation: String,
    pohStation: String,
    repairTasks: [repairTaskSchema],
    isSteamed: { type: Boolean, default: false },
    isDegassed: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
wagonSchema.index({ wagonNo: 'text', owner: 'text', type: 'text' });
wagonSchema.index({ status: 1, type: 1 });
wagonSchema.index({ createdAt: -1 });
wagonSchema.index({ category: 1 });

module.exports = mongoose.model('Wagon', wagonSchema);
