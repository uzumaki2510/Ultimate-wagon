const mongoose = require('mongoose');
const { INSPECTION_TYPES, INSPECTION_RESULTS } = require('../utils/constants');

const checklistItemSchema = new mongoose.Schema(
  {
    checked: { type: Boolean, default: false },
    checkedBy: String,
    checkedAt: Date,
    remarks: String,
  },
  { _id: false }
);

const inspectionChecklistSchema = new mongoose.Schema(
  {
    // Wheel & Axle
    wheelCondition: checklistItemSchema,
    bearingCondition: checklistItemSchema,
    axleBox: checklistItemSchema,
    wheelProfile: checklistItemSchema,
    // Brake
    brakePipe: checklistItemSchema,
    brakeCylinder: checklistItemSchema,
    distributorValve: checklistItemSchema,
    brakeBinding: checklistItemSchema,
    airPressure: checklistItemSchema,
    // Coupler / CBC
    cbc: checklistItemSchema,
    knuckle: checklistItemSchema,
    draftGear: checklistItemSchema,
    buffer: checklistItemSchema,
    // Body / Structure
    bodyCondition: checklistItemSchema,
    doorHatch: checklistItemSchema,
    ladder: checklistItemSchema,
    floorRoofSideWall: checklistItemSchema,
    corrosion: checklistItemSchema,
    // Underframe
    headStock: checklistItemSchema,
    soleBar: checklistItemSchema,
    crossBar: checklistItemSchema,
    floorPlate: checklistItemSchema,
    derusting: checklistItemSchema,
    // Bogie & Suspension
    spring: checklistItemSchema,
    snubberSpring: checklistItemSchema,
    sideBearer: checklistItemSchema,
    centrePivot: checklistItemSchema,
    elastomericPad: checklistItemSchema,
    suspension: checklistItemSchema,
    // Painting
    surfacePrep: checklistItemSchema,
    painting: checklistItemSchema,
    marking: checklistItemSchema,
    finalFinishing: checklistItemSchema,
    // Scheduled Maintenance
    rohPohStatus: checklistItemSchema,
    yardExam: checklistItemSchema,
    periodicInspection: checklistItemSchema,
    maintenanceFinalInspection: checklistItemSchema,
    // Tank Wagon Safety
    masterValve: checklistItemSchema,
    bottomDischargeValve: checklistItemSchema,
    deliveryPipe: checklistItemSchema,
    tankBarrel: checklistItemSchema,
    leakage: checklistItemSchema,
    safetyFittings: checklistItemSchema,
    steamPurgeDegassing: checklistItemSchema,
    // Final
    defectRectified: checklistItemSchema,
    finalInspectionDone: checklistItemSchema,
    readyForFitMarking: checklistItemSchema,
  },
  { _id: false }
);

const inspectionSchema = new mongoose.Schema(
  {
    wagon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wagon',
      required: [true, 'Wagon reference is required'],
      index: true,
    },
    inspectionNo: {
      type: String,
      unique: true,
    },
    type: {
      type: String,
      required: [true, 'Inspection type is required'],
      enum: { values: INSPECTION_TYPES, message: 'Invalid inspection type' },
    },
    date: {
      type: Date,
      required: [true, 'Inspection date is required'],
      default: Date.now,
    },
    checklist: inspectionChecklistSchema,
    inspectorName: {
      type: String,
      required: [true, 'Inspector name is required'],
      trim: true,
    },
    safetyValidation: {
      result: { type: String, enum: ['Pass', 'Fail'] },
      notes: String,
    },
    result: {
      type: String,
      enum: INSPECTION_RESULTS,
    },
    remarks: {
      type: String,
      trim: true,
    },
    roh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ROH',
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

// Auto-generate inspectionNo
inspectionSchema.pre('save', async function (next) {
  if (!this.inspectionNo) {
    const count = await this.constructor.countDocuments();
    this.inspectionNo = `INS-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

inspectionSchema.index({ createdAt: -1 });
inspectionSchema.index({ type: 1, result: 1 });

module.exports = mongoose.model('Inspection', inspectionSchema);
