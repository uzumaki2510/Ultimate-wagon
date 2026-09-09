const searchText = require('../utils/searchText');
const Wagon = require('../models/Wagon');
const Workflow = require('../models/Workflow');
const write = require('../services/operationalWrite');
const { assertFit } = require('../services/fitnessService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');
const { getWagonHistory } = require('../services/wagonService');

// @desc    Create wagon
// @route   POST /api/v1/wagons
const createWagon = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;

  const existing = await Wagon.findOne({ wagonNo: req.body.wagonNo });
  if (existing) {
    throw ApiError.conflict(`Wagon ${req.body.wagonNo} already exists`);
  }

  if (!['ARRIVED', 'SICK_LINE', 'INSPECTION_PENDING'].includes(req.body.status)) throw ApiError.badRequest('New wagons must start at arrival or inspection');
  const wagon = await write(req, 'Wagon created', async session => (await Wagon.create([req.body], { session }))[0]);
  return ApiResponse.created(res, 'Wagon created', wagon);
});

// @desc    Get all wagons (paginated, filtered, searchable)
// @route   GET /api/v1/wagons
const getWagons = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { q, status, type, category, priority, owner } = req.query;

  const filter = { deletedAt: null, archived: req.query.archived === true ? true : { $ne: true } };
  if (q) {
    filter.$or = [
      { wagonNo: { $regex: searchText(q), $options: 'i' } },
      { owner: { $regex: searchText(q), $options: 'i' } },
      { type: { $regex: searchText(q), $options: 'i' } },
    ];
  }
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (owner) filter.owner = { $regex: searchText(owner), $options: 'i' };

  const [wagons, total] = await Promise.all([
    Wagon.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('createdBy', 'name email')
      .lean(),
    Wagon.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Wagons retrieved', wagons, buildPaginationMeta(total, page, limit));
});

// @desc    Get single wagon
// @route   GET /api/v1/wagons/:id
const getWagon = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findOne({ _id: req.params.id, deletedAt: null }).populate('createdBy', 'name email').lean();
  if (!wagon) throw ApiError.notFound('Wagon not found');
  return ApiResponse.success(res, 'Wagon retrieved', wagon);
});

// @desc    Update wagon
// @route   PUT /api/v1/wagons/:id
const updateWagon = asyncHandler(async (req, res) => {
  const wagon = await write(req, 'Wagon updated', async session => {
    const record = await Wagon.findOne({ _id: req.params.id, deletedAt: null }).session(session);
    if (!record) throw ApiError.notFound('Wagon not found');
    const { expectedUpdatedAt, ...patch } = req.body;
    if (req.user.role === 'employee' && (patch.fitConfirmation || ['FIT_READY', 'RELEASED'].includes(patch.status) || ['FIT_READY', 'RELEASED'].includes(record.status))) throw ApiError.forbidden('Only an administrator can certify, release, or modify a certified wagon');
    if (!expectedUpdatedAt || new Date(expectedUpdatedAt).getTime() !== record.updatedAt.getTime()) throw ApiError.conflict('Wagon changed. Refresh and try again');
    if (patch.status === 'RELEASED' && record.status !== 'FIT_READY') throw ApiError.badRequest('Only a fit wagon can be released');
    if (patch.type && patch.type !== record.type && await Workflow.exists({ wagonId: record._id }).session(session)) throw ApiError.conflict('Wagon type cannot change after workflow creation');
    const previousStatus = record.status;
    if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(previousStatus) && ['repairTasks', 'inspectionChecklist', 'fitConfirmation', 'isDegassed', 'isSteamed'].some(key => key in patch)) throw ApiError.conflict('Reopen the wagon before changing certified evidence');
    if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(previousStatus) && patch.status && patch.status !== previousStatus && patch.status !== 'RELEASED') throw ApiError.conflict('Use the audited reopen action before changing certified work');
    Object.assign(record, patch);
    if (['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(record.status)) await assertFit(record, session);
    else record.fitConfirmation = undefined;
    if (patch.status === 'RELEASED' && previousStatus !== 'RELEASED') record.releasedAt = new Date();
    if (patch.status === 'FIT_READY' && previousStatus !== 'FIT_READY') record.certifiedAt = new Date();
    if (record.fitConfirmation && patch.status === 'FIT_READY' && previousStatus !== 'FIT_READY') {
      record.fitConfirmation.confirmedBy = req.user._id.toString();
      record.fitConfirmation.confirmedAt = new Date().toISOString();
      record.fitConfirmation.inspectorName = req.user.name;
    }
    await record.save({ session });
    if (patch.wagonNo) await Workflow.updateMany({ wagonId: record._id }, { $set: { wagonNo: record.wagonNo } }, { session });
    return record;
  });
  return ApiResponse.success(res, 'Wagon updated', wagon);
});

// @desc    Delete wagon
// @route   DELETE /api/v1/wagons/:id
const deleteWagon = asyncHandler(async (req, res) => {
  await write(req, 'Wagon deleted', async session => {
    const wagon = await Wagon.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { new: true, session });
    if (!wagon) throw ApiError.notFound('Wagon not found');
    return wagon;
  });
  return ApiResponse.success(res, 'Wagon deleted');
});

// @desc    Get full wagon history
// @route   GET /api/v1/wagons/:id/history
const getWagonFullHistory = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!wagon) throw ApiError.notFound('Wagon not found');

  const history = await getWagonHistory(req.params.id);
  return ApiResponse.success(res, 'Wagon history retrieved', { wagon, ...history });
});

// @desc    Advanced search
// @route   GET /api/v1/wagons/search
const searchWagons = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { q } = req.query;

  if (!q) {
    throw ApiError.badRequest('Search query (q) is required');
  }

  const filter = {
    deletedAt: null, archived: { $ne: true },
    $or: [
      { wagonNo: { $regex: searchText(q), $options: 'i' } },
      { owner: { $regex: searchText(q), $options: 'i' } },
      { type: { $regex: searchText(q), $options: 'i' } },
      { category: { $regex: searchText(q), $options: 'i' } },
      { currentLocation: { $regex: searchText(q), $options: 'i' } },
    ],
  };

  const [wagons, total] = await Promise.all([
    Wagon.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Wagon.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Search results', wagons, buildPaginationMeta(total, page, limit));
});

const getDeleted = asyncHandler(async (req, res) => ApiResponse.success(res, 'Deleted wagons', await Wagon.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 }).lean()));
const restoreWagon = asyncHandler(async (req, res) => {
  const wagon = await write(req, 'Wagon restored', session => Wagon.findOneAndUpdate({ _id: req.params.id, deletedAt: { $ne: null } }, { $set: { deletedAt: null } }, { new: true, session }));
  if (!wagon) throw ApiError.notFound('Deleted wagon not found');
  return ApiResponse.success(res, 'Wagon restored', wagon);
});
module.exports = { getDeleted, restoreWagon, createWagon, getWagons, getWagon, updateWagon, deleteWagon, getWagonFullHistory, searchWagons };
