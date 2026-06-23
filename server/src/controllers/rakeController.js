const Rake = require('../models/Rake');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.createRake = asyncHandler(async (req, res) => {
  const existing = await Rake.findOne({ rakeId: req.body.rakeId });
  if (existing) {
    throw ApiError.conflict(`Rake ${req.body.rakeId} already exists`);
  }
  const rake = await Rake.create(req.body);
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
  const rake = await Rake.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!rake) throw ApiError.notFound('Rake not found');
  return ApiResponse.success(res, 'Rake updated', rake);
});

exports.deleteRake = asyncHandler(async (req, res) => {
  const rake = await Rake.findByIdAndDelete(req.params.id);
  if (!rake) throw ApiError.notFound('Rake not found');
  return ApiResponse.success(res, 'Rake deleted');
});
