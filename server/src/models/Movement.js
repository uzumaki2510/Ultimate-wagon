const mongoose = require('mongoose');
const { MOVEMENT_STATUSES } = require('../utils/constants');

const movementSchema = new mongoose.Schema(
  {
    wagon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wagon',
      required: [true, 'Wagon reference is required'],
      index: true,
    },
    fromLocation: {
      type: String,
      required: [true, 'From location is required'],
      trim: true,
    },
    toLocation: {
      type: String,
      required: [true, 'To location is required'],
      trim: true,
    },
    movedAt: {
      type: Date,
      required: [true, 'Movement date/time is required'],
      default: Date.now,
    },
    purpose: {
      type: String,
      trim: true,
    },
    rakeId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: { values: MOVEMENT_STATUSES, message: 'Invalid movement status' },
      default: 'In Transit',
    },
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

movementSchema.index({ createdAt: -1 });
movementSchema.index({ wagon: 1, movedAt: -1 });

module.exports = mongoose.model('Movement', movementSchema);
