const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  wagonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wagon', required: true, index: true },
  name: { type: String, required: true }, type: { type: String, required: true },
  fileType: { type: String, required: true }, size: Number, digest: String,
  content: { type: Buffer, required: true, select: false },
  version: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, uploadedByName: String,
  uploadedAt: { type: Date, default: Date.now },
  scanStatus: { type: String, enum: ['clean', 'quarantined', 'rejected'], default: 'quarantined' },
  scannedAt: Date,
  deletedAt: { type: Date, default: null }, deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
schema.index({ wagonId: 1, version: 1 }, { unique: true });
module.exports = mongoose.model('WagonDocument', schema);
