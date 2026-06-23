const Wagon = require('../models/Wagon');
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

  const wagon = await Wagon.create(req.body);
  return ApiResponse.created(res, 'Wagon created', wagon);
});

// @desc    Get all wagons (paginated, filtered, searchable)
// @route   GET /api/v1/wagons
const getWagons = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { q, status, type, category, priority, owner } = req.query;

  const filter = {};
  if (q) {
    filter.$or = [
      { wagonNo: { $regex: q, $options: 'i' } },
      { owner: { $regex: q, $options: 'i' } },
      { type: { $regex: q, $options: 'i' } },
    ];
  }
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (owner) filter.owner = { $regex: owner, $options: 'i' };

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
  const wagon = await Wagon.findById(req.params.id).populate('createdBy', 'name email').lean();
  if (!wagon) throw ApiError.notFound('Wagon not found');
  return ApiResponse.success(res, 'Wagon retrieved', wagon);
});

// @desc    Update wagon
// @route   PUT /api/v1/wagons/:id
const updateWagon = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!wagon) throw ApiError.notFound('Wagon not found');
  return ApiResponse.success(res, 'Wagon updated', wagon);
});

// @desc    Delete wagon
// @route   DELETE /api/v1/wagons/:id
const deleteWagon = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findByIdAndDelete(req.params.id);
  if (!wagon) throw ApiError.notFound('Wagon not found');
  return ApiResponse.success(res, 'Wagon deleted');
});

// @desc    Get full wagon history
// @route   GET /api/v1/wagons/:id/history
const getWagonFullHistory = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findById(req.params.id).lean();
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
    $or: [
      { wagonNo: { $regex: q, $options: 'i' } },
      { owner: { $regex: q, $options: 'i' } },
      { type: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
      { currentLocation: { $regex: q, $options: 'i' } },
    ],
  };

  const [wagons, total] = await Promise.all([
    Wagon.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Wagon.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Search results', wagons, buildPaginationMeta(total, page, limit));
});

module.exports = { createWagon, getWagons, getWagon, updateWagon, deleteWagon, getWagonFullHistory, searchWagons };
