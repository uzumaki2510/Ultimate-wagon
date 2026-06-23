const Inspection = require('../models/Inspection');
const Wagon = require('../models/Wagon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

// @desc    Create inspection
// @route   POST /api/v1/inspections
const createInspection = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findById(req.body.wagon);
  if (!wagon) throw ApiError.notFound('Wagon not found');

  req.body.createdBy = req.user._id;
  const inspection = await Inspection.create(req.body);

  await Wagon.findByIdAndUpdate(req.body.wagon, { status: 'Under Inspection' });

  return ApiResponse.created(res, 'Inspection created', inspection);
});

// @desc    Get all inspections
// @route   GET /api/v1/inspections
const getInspections = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { type, result, wagon } = req.query;

  const filter = {};
  if (type) filter.type = type;
  if (result) filter.result = result;
  if (wagon) filter.wagon = wagon;

  const [inspections, total] = await Promise.all([
    Inspection.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('wagon', 'wagonNo type owner')
      .populate('createdBy', 'name')
      .lean(),
    Inspection.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Inspections retrieved', inspections, buildPaginationMeta(total, page, limit));
});

// @desc    Get single inspection
// @route   GET /api/v1/inspections/:id
const getInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findById(req.params.id)
    .populate('wagon', 'wagonNo type owner status category')
    .populate('roh')
    .populate('createdBy', 'name')
    .lean();
  if (!inspection) throw ApiError.notFound('Inspection not found');
  return ApiResponse.success(res, 'Inspection retrieved', inspection);
});

// @desc    Update inspection
// @route   PUT /api/v1/inspections/:id
const updateInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!inspection) throw ApiError.notFound('Inspection not found');
  return ApiResponse.success(res, 'Inspection updated', inspection);
});

// @desc    Delete inspection
// @route   DELETE /api/v1/inspections/:id
const deleteInspection = asyncHandler(async (req, res) => {
  const inspection = await Inspection.findByIdAndDelete(req.params.id);
  if (!inspection) throw ApiError.notFound('Inspection not found');
  return ApiResponse.success(res, 'Inspection deleted');
});

module.exports = { createInspection, getInspections, getInspection, updateInspection, deleteInspection };
