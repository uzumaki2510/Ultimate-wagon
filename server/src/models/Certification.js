const mongoose = require('mongoose');
const { CERTIFICATION_TYPES, CERTIFICATION_STATUSES } = require('../utils/constants');

const certificationSchema = new mongoose.Schema(
  {
    wagon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wagon',
      required: [true, 'Wagon reference is required'],
      index: true,
    },
    certNo: {
      type: String,
      unique: true,
    },
    type: {
      type: String,
      required: [true, 'Certificate type is required'],
      enum: { values: CERTIFICATION_TYPES, message: 'Invalid certificate type' },
    },
    issuedDate: {
      type: Date,
      required: [true, 'Issue date is required'],
      default: Date.now,
    },
    expiryDate: Date,
    issuedBy: {
      type: String,
      required: [true, 'Issuer name is required'],
      trim: true,
    },
    inspections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inspection',
      },
    ],
    status: {
      type: String,
      enum: { values: CERTIFICATION_STATUSES, message: 'Invalid certification status' },
      default: 'Valid',
      index: true,
    },
    revokedAt: Date,
    revokedBy: String,
    revokeReason: String,
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

// Auto-generate certNo
certificationSchema.pre('save', async function (next) {
  if (!this.certNo) {
    const count = await this.constructor.countDocuments();
    this.certNo = `CERT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

certificationSchema.index({ createdAt: -1 });
certificationSchema.index({ expiryDate: 1, status: 1 });

module.exports = mongoose.model('Certification', certificationSchema);
