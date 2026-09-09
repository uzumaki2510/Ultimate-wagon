const Wagon = require('../models/Wagon');
const write = require('../services/operationalWrite');
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
  
  req.body.createdBy = req.user._id;

  const memo = await write(req, 'Memo created', async session => {
    await validateEntries(req.body, session);
    const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => ['memoNo','memoType','date','time','rakeId','rakeName','yard','lineNo','remarks','entries','approvals','archived'].includes(key)));
    payload.createdBy = req.user._id;
    payload.approvals = (payload.approvals || []).map(a => ({ role: a.role, status: 'Pending' }));
    return (await Memo.create([payload], { session }))[0];
  });
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
  const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => ["memoNo","memoType","date","time","rakeId","rakeName","yard","lineNo","remarks","entries","approvals","archived"].includes(key)));
  const memo = await write(req, 'Memo updated', async session => {
    const record = await Memo.findById(req.params.id).session(session);
    if (!record) throw ApiError.notFound('Memo not found');
    if (!req.body.expectedUpdatedAt || new Date(req.body.expectedUpdatedAt).getTime() !== record.updatedAt.getTime()) throw ApiError.conflict('Memo changed. Refresh and try again');
    if (patch.approvals) patch.approvals = patch.approvals.map(a => ({ ...a, name: req.user.name, approvedAt: new Date() }));
    Object.assign(record, patch);
    await validateEntries(record, session);
    await record.save({ session });
    return record;
  });
  return ApiResponse.success(res, 'Memo updated', memo);
});

exports.deleteMemo = asyncHandler(async (req, res) => {
  const memo = await write(req, 'Memo deleted', session => Memo.findByIdAndDelete(req.params.id, { session }));
  if (!memo) throw ApiError.notFound('Memo not found');
  return ApiResponse.success(res, 'Memo deleted');
});

async function validateEntries(memo, session) {
  if (!Array.isArray(memo.entries) || !memo.entries.length || memo.entries.length > 500) throw ApiError.badRequest('A memo needs 1–500 wagon entries');
  const ids = memo.entries.map(e => String(e.wagonId));
  if (new Set(ids).size !== ids.length) throw ApiError.badRequest('Duplicate wagon entries');
  const wagons = await Wagon.find({ _id: { $in: ids }, deletedAt: null }).session(session);
  if (wagons.length !== ids.length) throw ApiError.badRequest('One or more wagons do not exist');
  if (memo.memoType === 'fit' && wagons.some(w => !['FIT_READY', 'RELEASED'].includes(w.status))) throw ApiError.badRequest('Fit memos require certified wagons');
}
