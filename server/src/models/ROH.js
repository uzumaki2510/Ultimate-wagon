const mongoose = require('mongoose');
const { ROH_STATUSES } = require('../utils/constants');

const rohSchema = new mongoose.Schema(
  {
    wagon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wagon',
      required: [true, 'Wagon reference is required'],
      index: true,
    },
    rohNo: {
      type: String,
      unique: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    startDate: Date,
    completionDate: Date,
    station: {
      type: String,
      required: [true, 'Station is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: { values: ROH_STATUSES, message: 'Invalid ROH status' },
      default: 'Scheduled',
      index: true,
    },
    inspections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inspection',
      },
    ],
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

// Auto-generate rohNo
rohSchema.pre('save', async function (next) {
  if (!this.rohNo) {
    const count = await this.constructor.countDocuments();
    this.rohNo = `ROH-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

rohSchema.index({ createdAt: -1 });
rohSchema.index({ scheduledDate: 1, status: 1 });

module.exports = mongoose.model('ROH', rohSchema);
