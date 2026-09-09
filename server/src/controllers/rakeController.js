const Wagon = require('../models/Wagon');
const write = require('../services/operationalWrite');
const Rake = require('../models/Rake');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.createRake = asyncHandler(async (req, res) => {
  const existing = await Rake.findOne({ rakeId: req.body.rakeId });
  if (existing) {
    throw ApiError.conflict(`Rake ${req.body.rakeId} already exists`);
  }
  const rake = await write(req, 'Rake created', async session => {
    const { rakeId, rakeName, yard, wagonIds = [] } = req.body;
    if (!Array.isArray(wagonIds) || wagonIds.length > 500) throw ApiError.badRequest('Invalid wagon membership');
    const ids = [...new Set(wagonIds.map(String))];
    if (await Wagon.countDocuments({ _id: { $in: ids }, deletedAt: null }).session(session) !== ids.length) throw ApiError.badRequest('Invalid wagon membership');
    if (await Wagon.exists({ _id: { $in: ids }, rakeId: { $nin: [null, ''] } }).session(session)) throw ApiError.conflict('Remove wagons from their existing rake first');
    const [record] = await Rake.create([{ rakeId, rakeName, yard, wagonIds: ids }], { session });
    await Wagon.updateMany({ _id: { $in: ids } }, { $set: { rakeId: record._id.toString() } }, { session });
    return record;
  });
  return ApiResponse.created(res, 'Rake created', rake);
});

exports.getRakes = asyncHandler(async (req, res) => {
  const rakes = await Rake.find().lean();
  return ApiResponse.success(res, 'Rakes retrieved', rakes);
});

exports.getRake = asyncHandler(async (req, res) => {
  const rake = await Rake.findById(req.params.id).lean();
  if (!rake) throw ApiError.notFound('Rake not found');
  return ApiResponse.success(res, 'Rake retrieved', rake);
});

exports.updateRake = asyncHandler(async (req, res) => {
  const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => ["rakeId","rakeName","yard","wagonIds"].includes(key)));
  const rake = await write(req, 'Rake updated', async session => {
    const record = await Rake.findById(req.params.id).session(session);
    if (!record) throw ApiError.notFound('Rake not found');
    if (!req.body.expectedUpdatedAt || new Date(req.body.expectedUpdatedAt).getTime() !== record.updatedAt.getTime()) throw ApiError.conflict('Rake changed. Refresh and try again');
    if (patch.wagonIds) {
      if (!Array.isArray(patch.wagonIds) || patch.wagonIds.length > 500) throw ApiError.badRequest('Invalid wagon membership');
      const ids = [...new Set(patch.wagonIds.map(String))];
      if (await Wagon.exists({ _id: { $in: ids }, rakeId: { $nin: [null, '', record._id.toString()] } }).session(session)) throw ApiError.conflict('Remove wagons from their existing rake first');
      if (await Wagon.countDocuments({ _id: { $in: ids }, deletedAt: null }).session(session) !== ids.length) throw ApiError.badRequest('Invalid wagon membership');
      await Wagon.updateMany({ rakeId: record._id.toString(), _id: { $nin: ids } }, { $unset: { rakeId: 1 } }, { session });
      await Wagon.updateMany({ _id: { $in: ids } }, { $set: { rakeId: record._id.toString() } }, { session });
      patch.wagonIds = ids;
    }
    Object.assign(record, patch);
    await record.save({ session });
    return record;
  });
  return ApiResponse.success(res, 'Rake updated', rake);
});

exports.deleteRake = asyncHandler(async (req, res) => {
  const rake = await write(req, 'Rake deleted', async session => {
    const record = await Rake.findByIdAndDelete(req.params.id, { session });
    if (!record) throw ApiError.notFound('Rake not found');
    await Wagon.updateMany({ rakeId: record._id.toString() }, { $unset: { rakeId: 1 } }, { session });
    return record;
  });
  if (!rake) throw ApiError.notFound('Rake not found');
  return ApiResponse.success(res, 'Rake deleted');
});
