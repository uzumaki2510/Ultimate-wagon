const Movement = require('../models/Movement');
const Wagon = require('../models/Wagon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

const createMovement = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findById(req.body.wagon);
  if (!wagon) throw ApiError.notFound('Wagon not found');

  req.body.createdBy = req.user._id;
  const movement = await Movement.create(req.body);

  // Update wagon's current location
  await Wagon.findByIdAndUpdate(req.body.wagon, { currentLocation: req.body.toLocation });

  return ApiResponse.created(res, 'Movement logged', movement);
});

const getMovements = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { status, wagon } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (wagon) filter.wagon = wagon;

  const [movements, total] = await Promise.all([
    Movement.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('wagon', 'wagonNo type owner')
      .populate('createdBy', 'name')
      .lean(),
    Movement.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Movements retrieved', movements, buildPaginationMeta(total, page, limit));
});

const getMovement = asyncHandler(async (req, res) => {
  const movement = await Movement.findById(req.params.id)
    .populate('wagon', 'wagonNo type owner status')
    .populate('createdBy', 'name')
    .lean();
  if (!movement) throw ApiError.notFound('Movement not found');
  return ApiResponse.success(res, 'Movement retrieved', movement);
});

const getWagonMovements = asyncHandler(async (req, res) => {
  const movements = await Movement.find({ wagon: req.params.wagonId })
    .sort({ movedAt: -1 })
    .populate('createdBy', 'name')
    .lean();
  return ApiResponse.success(res, 'Wagon movement history', movements);
});

const updateMovement = asyncHandler(async (req, res) => {
  const movement = await Movement.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!movement) throw ApiError.notFound('Movement not found');
  return ApiResponse.success(res, 'Movement updated', movement);
});

const deleteMovement = asyncHandler(async (req, res) => {
  const movement = await Movement.findByIdAndDelete(req.params.id);
  if (!movement) throw ApiError.notFound('Movement not found');
  return ApiResponse.success(res, 'Movement deleted');
});

module.exports = { createMovement, getMovements, getMovement, getWagonMovements, updateMovement, deleteMovement };
