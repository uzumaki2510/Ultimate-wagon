const mongoose = require('mongoose');
const { REPAIR_CATEGORIES, REPAIR_STATUSES, PRIORITY_LEVELS } = require('../utils/constants');

const sparePartSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    partNo: String,
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'pcs' },
  },
  { _id: false }
);

const repairSchema = new mongoose.Schema(
  {
    wagon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wagon',
      required: [true, 'Wagon reference is required'],
      index: true,
    },
    sickLine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SickLine',
    },
    repairNo: {
      type: String,
      unique: true,
    },
    category: {
      type: String,
      required: [true, 'Repair category is required'],
      enum: { values: REPAIR_CATEGORIES, message: 'Invalid repair category' },
    },
    description: {
      type: String,
      required: [true, 'Repair description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: PRIORITY_LEVELS,
      default: 'Normal',
    },
    spareParts: [sparePartSchema],
    labourHours: {
      type: Number,
      min: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    startDate: Date,
    completionDate: Date,
    status: {
      type: String,
      enum: { values: REPAIR_STATUSES, message: 'Invalid repair status' },
      default: 'Pending',
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
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

// Auto-generate repairNo
repairSchema.pre('save', async function (next) {
  if (!this.repairNo) {
    const count = await this.constructor.countDocuments();
    this.repairNo = `REP-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

repairSchema.index({ createdAt: -1 });
repairSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Repair', repairSchema);
