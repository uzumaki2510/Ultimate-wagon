const mongoose = require('mongoose');
const { SICK_LINE_STATUSES, SICK_REASONS, BOOKED_TO, SICK_LINES, PRIORITY_LEVELS } = require('../utils/constants');

const defectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    severity: { type: String, enum: PRIORITY_LEVELS, default: 'Normal' },
    description: String,
  },
  { _id: false }
);

const sickLineSchema = new mongoose.Schema(
  {
    wagon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wagon',
      required: [true, 'Wagon reference is required'],
      index: true,
    },
    sickLineNo: {
      type: String,
      unique: true,
    },
    entryDate: {
      type: Date,
      required: [true, 'Entry date is required'],
      default: Date.now,
    },
    reason: {
      type: String,
      required: [true, 'Sick reason is required'],
      enum: { values: SICK_REASONS, message: 'Invalid sick reason' },
    },
    bookedTo: {
      type: String,
      enum: BOOKED_TO,
    },
    sickLine: {
      type: String,
      enum: SICK_LINES,
    },
    defects: [defectSchema],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: { values: SICK_LINE_STATUSES, message: 'Invalid status' },
      default: 'Open',
      index: true,
    },
    closedAt: Date,
    remarks: {
      type: String,
      trim: true,
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

// Auto-generate sickLineNo before save
sickLineSchema.pre('save', async function (next) {
  if (!this.sickLineNo) {
    const count = await this.constructor.countDocuments();
    this.sickLineNo = `SL-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

sickLineSchema.index({ createdAt: -1 });
sickLineSchema.index({ wagon: 1, status: 1 });

module.exports = mongoose.model('SickLine', sickLineSchema);
