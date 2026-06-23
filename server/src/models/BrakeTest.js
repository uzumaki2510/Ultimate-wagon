const mongoose = require('mongoose');
const { BRAKE_TEST_TYPES, BRAKE_TEST_RESULTS } = require('../utils/constants');

const brakeTestSchema = new mongoose.Schema(
  {
    wagon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wagon',
      required: [true, 'Wagon reference is required'],
      index: true,
    },
    testNo: {
      type: String,
      unique: true,
    },
    testType: {
      type: String,
      required: [true, 'Test type is required'],
      enum: { values: BRAKE_TEST_TYPES, message: 'Invalid test type' },
    },
    testDate: {
      type: Date,
      required: [true, 'Test date is required'],
      default: Date.now,
    },
    brakePower: {
      type: Number,
      min: [0, 'Brake power cannot be negative'],
      max: [100, 'Brake power cannot exceed 100%'],
    },
    airPressure: {
      type: Number,
      min: 0,
    },
    cylinderPressure: {
      type: Number,
      min: 0,
    },
    pipeLeakage: {
      type: Boolean,
      default: false,
    },
    distributorValveOk: {
      type: Boolean,
      default: true,
    },
    brakeBlockCondition: {
      type: String,
      trim: true,
    },
    result: {
      type: String,
      required: [true, 'Test result is required'],
      enum: { values: BRAKE_TEST_RESULTS, message: 'Invalid test result' },
    },
    testedBy: {
      type: String,
      required: [true, 'Tested by is required'],
      trim: true,
    },
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

// Auto-generate testNo
brakeTestSchema.pre('save', async function (next) {
  if (!this.testNo) {
    const count = await this.constructor.countDocuments();
    this.testNo = `BT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

brakeTestSchema.index({ createdAt: -1 });
brakeTestSchema.index({ testType: 1, result: 1 });

module.exports = mongoose.model('BrakeTest', brakeTestSchema);
