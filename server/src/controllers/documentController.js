const crypto = require('node:crypto');
const Wagon = require('../models/Wagon');
const Document = require('../models/WagonDocument');
const security = require('../services/documentSecurity');
const write = require('../services/operationalWrite');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
async function parent(id, session) {
  const wagon = await Wagon.findOne({ _id: id, deletedAt: null }).session(session || null);
  if (!wagon) throw ApiError.notFound('Wagon not found');
  return wagon;
}
const metadata = doc => { const result = doc.toObject(); delete result.content; return result; };
exports.list = asyncHandler(async (req, res) => {
  await parent(req.params.wagonId);
  return ApiResponse.success(res, 'Saved documents', await Document.find({ wagonId: req.params.wagonId, deletedAt: null }).sort({ version: -1 }).lean());
});
exports.upload = asyncHandler(async (req, res) => {
  const mime = req.get('Content-Type')?.split(';')[0];
  security.validateFile(req.body, mime);
  const { name, type } = req.query;
  if (typeof name !== 'string' || !name.trim() || name.length > 200 || /[\x00-\x1f/\\]/.test(name) || !security.TYPES.includes(type)) throw ApiError.badRequest('Valid document name and type required');
  await parent(req.params.wagonId);
  let scanStatus;
  try { scanStatus = await security.scan(req.body); } catch { throw new ApiError(503, 'Security scanner unavailable. Retry the upload later'); }
  if (scanStatus === 'rejected') throw ApiError.badRequest('Security scan rejected this file');
  const document = await write(req, 'Document uploaded', async session => {
    const wagon = await parent(req.params.wagonId, session);
    if (wagon.archived) throw ApiError.conflict('Archived wagon documents are read-only');
    if (req.user.role === 'employee' && (String(wagon.assignment?.assigneeId || '') !== String(req.user._id) || ['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status))) throw ApiError.forbidden('Only assigned staff may attach evidence to active work');
    wagon.documentSequence = (wagon.documentSequence || 0) + 1;
    await wagon.save({ session });
    const [doc] = await Document.create([{ wagonId: wagon._id, name: name.trim(), type, fileType: mime, size: req.body.length, content: req.body, digest: crypto.createHash('sha256').update(req.body).digest('hex'), version: wagon.documentSequence, uploadedBy: req.user._id, uploadedByName: req.user.name, scanStatus, scannedAt: scanStatus === 'clean' ? new Date() : undefined }], { session });
    return doc;
  });
  return ApiResponse.created(res, scanStatus === 'clean' ? 'Document saved and scanned' : 'Document saved in quarantine; configure the security scanner before download', metadata(document));
});
exports.download = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, deletedAt: null }).select('+content');
  if (!doc) throw ApiError.notFound('Document not found');
  await parent(doc.wagonId);
  if (doc.scanStatus !== 'clean') throw ApiError.conflict('Document is quarantined pending a successful security scan');
  res.set('Content-Type', doc.fileType);
  res.set('Content-Disposition', `attachment; filename="document-${doc.version}.${doc.fileType === 'application/pdf' ? 'pdf' : doc.fileType === 'image/png' ? 'png' : 'jpg'}"; filename*=UTF-8''${encodeURIComponent(doc.name).replace(/'/g, '%27')}`);
  res.set('Cache-Control', 'no-store'); res.set('X-Content-Type-Options', 'nosniff');
  res.send(doc.content);
});
exports.rescan = asyncHandler(async (req, res) => {
  const source = await Document.findOne({ _id: req.params.id, deletedAt: null }).select('+content');
  if (!source) throw ApiError.notFound('Document not found');
  await parent(source.wagonId);
  let status;
  try { status = await security.scan(source.content); } catch { throw new ApiError(503, 'Security scanner unavailable'); }
  const doc = await write(req, 'Document scanned', async session => {
    const record = await Document.findOne({ _id: source._id, deletedAt: null }).session(session);
    if (!record) throw ApiError.notFound('Document no longer available');
    await parent(record.wagonId, session);
    record.scanStatus = status; record.scannedAt = status !== 'quarantined' ? new Date() : null; await record.save({ session }); return record;
  });
  return ApiResponse.success(res, status === 'quarantined' ? 'Scanner not configured; file remains quarantined' : 'Scan complete', metadata(doc));
});
exports.remove = asyncHandler(async (req, res) => {
  await write(req, 'Document withdrawn', async session => {
    const doc = await Document.findOne({ _id: req.params.id, deletedAt: null }).session(session);
    if (!doc) throw ApiError.notFound('Document not found');
    const wagon = await parent(doc.wagonId, session);
    if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status)) throw ApiError.conflict('Reopen the wagon before withdrawing certification evidence');
    doc.deletedAt = new Date(); doc.deletedBy = req.user._id; await doc.save({ session }); return doc;
  });
  return ApiResponse.success(res, 'Document withdrawn; stored evidence and audit retained');
});
