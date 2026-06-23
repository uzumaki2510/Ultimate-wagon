const BrakeTest = require('../models/BrakeTest');
const Wagon = require('../models/Wagon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

const createBrakeTest = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findById(req.body.wagon);
  if (!wagon) throw ApiError.notFound('Wagon not found');

  req.body.createdBy = req.user._id;
  const test = await BrakeTest.create(req.body);

  await Wagon.findByIdAndUpdate(req.body.wagon, { status: 'Awaiting Testing' });

  return ApiResponse.created(res, 'Brake test recorded', test);
});

const getBrakeTests = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { testType, result, wagon } = req.query;

  const filter = {};
  if (testType) filter.testType = testType;
  if (result) filter.result = result;
  if (wagon) filter.wagon = wagon;

  const [tests, total] = await Promise.all([
    BrakeTest.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('wagon', 'wagonNo type owner')
      .populate('createdBy', 'name')
      .lean(),
    BrakeTest.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Brake tests retrieved', tests, buildPaginationMeta(total, page, limit));
});

const getBrakeTest = asyncHandler(async (req, res) => {
  const test = await BrakeTest.findById(req.params.id)
    .populate('wagon', 'wagonNo type owner status')
    .populate('createdBy', 'name')
    .lean();
  if (!test) throw ApiError.notFound('Brake test not found');
  return ApiResponse.success(res, 'Brake test retrieved', test);
});

const updateBrakeTest = asyncHandler(async (req, res) => {
  const test = await BrakeTest.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!test) throw ApiError.notFound('Brake test not found');
  return ApiResponse.success(res, 'Brake test updated', test);
});

const deleteBrakeTest = asyncHandler(async (req, res) => {
  const test = await BrakeTest.findByIdAndDelete(req.params.id);
  if (!test) throw ApiError.notFound('Brake test not found');
  return ApiResponse.success(res, 'Brake test deleted');
});

module.exports = { createBrakeTest, getBrakeTests, getBrakeTest, updateBrakeTest, deleteBrakeTest };
