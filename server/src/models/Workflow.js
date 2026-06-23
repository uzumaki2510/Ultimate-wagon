const mongoose = require('mongoose');

const workflowStageRecordSchema = new mongoose.Schema(
  {
    stageName: String,
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Done', 'Delayed', 'Skipped'],
      default: 'Pending',
    },
    startedAt: Date,
    completedAt: Date,
    durationHours: Number,
    targetDurationHours: Number,
    staffName: String,
    inspectorName: String,
    sscJeName: String,
    steamPointOperationName: String,
    fitterName: String,
    remarks: String,
  },
  { _id: false }
);

const workflowActionHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['START_STAGE', 'MARK_STAGE_DONE', 'ADVANCE_WORKFLOW', 'MARK_FIT'],
    },
    stageName: String,
    previousWorkflowSnapshot: String,
    createdAt: Date,
    userName: String,
    reason: String,
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    wagonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wagon',
      required: true,
    },
    memoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memo',
    },
    wagonNo: String,
    wagonType: String,
    currentStage: String,
    stages: [workflowStageRecordSchema],
    sscJeName: String,
    fitterName: String,
    actionHistory: [workflowActionHistorySchema],
  },
  {
    timestamps: true,
  }
);

workflowSchema.index({ wagonId: 1 });

module.exports = mongoose.model('Workflow', workflowSchema);
