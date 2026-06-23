const mongoose = require('mongoose');

const wagonMemoEntrySchema = new mongoose.Schema(
  {
    sno: Number,
    position: String,
    wagonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wagon',
      required: true,
    },
    reason: String,
    bookedTo: String,
    defects: String,
    status: String,
  },
  { _id: true }
);

const approvalSchema = new mongoose.Schema(
  {
    role: String,
    name: String,
    designation: String,
    signature: String,
    approvedAt: Date,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  { _id: false }
);

const memoSchema = new mongoose.Schema(
  {
    memoNo: {
      type: String,
      required: true,
      unique: true,
    },
    memoType: {
      type: String,
      enum: ['sick', 'fit'],
      default: 'sick',
    },
    date: String,
    time: String,
    rakeId: String,
    rakeName: String,
    yard: String,
    lineNo: String,
    createdBy: {
      type: mongoose.Schema.Types.Mixed, 
      // Using Mixed so it can accept the frontend string 'System' or ObjectId
    },
    remarks: String,
    entries: [wagonMemoEntrySchema],
    approvals: [approvalSchema],
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

memoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Memo', memoSchema);
