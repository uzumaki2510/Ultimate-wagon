const mongoose = require('mongoose');

const rakeSchema = new mongoose.Schema(
  {
    rakeId: {
      type: String,
      required: true,
      unique: true,
    },
    rakeName: String,
    yard: String,
    wagonIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wagon',
      },
    ],
  },
  {
    timestamps: true,
  }
);

rakeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Rake', rakeSchema);
