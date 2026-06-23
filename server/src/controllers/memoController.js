const Memo = require('../models/Memo');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

exports.createMemo = asyncHandler(async (req, res) => {
  const existing = await Memo.findOne({ memoNo: req.body.memoNo });
  if (existing) {
    throw ApiError.conflict(`Memo ${req.body.memoNo} already exists`);
  }
  
  if (!req.body.createdBy) {
     req.body.createdBy = req.user._id;
  }

  const memo = await Memo.create(req.body);
  return ApiResponse.created(res, 'Memo created', memo);
});

exports.getMemos = asyncHandler(async (req, res) => {
  const memos = await Memo.find().sort({ createdAt: -1 }).lean();
  return ApiResponse.success(res, 'Memos retrieved', memos);
});

exports.getMemo = asyncHandler(async (req, res) => {
  const memo = await Memo.findById(req.params.id).lean();
  if (!memo) throw ApiError.notFound('Memo not found');
  return ApiResponse.success(res, 'Memo retrieved', memo);
});

exports.updateMemo = asyncHandler(async (req, res) => {
  const memo = await Memo.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!memo) throw ApiError.notFound('Memo not found');
  return ApiResponse.success(res, 'Memo updated', memo);
});

exports.deleteMemo = asyncHandler(async (req, res) => {
  const memo = await Memo.findByIdAndDelete(req.params.id);
  if (!memo) throw ApiError.notFound('Memo not found');
  return ApiResponse.success(res, 'Memo deleted');
});
