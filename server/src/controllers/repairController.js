const Repair = require('../models/Repair');
const Wagon = require('../models/Wagon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

const createRepair = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findById(req.body.wagon);
  if (!wagon) throw ApiError.notFound('Wagon not found');

  req.body.createdBy = req.user._id;
  const repair = await Repair.create(req.body);

  await Wagon.findByIdAndUpdate(req.body.wagon, { status: 'Under Repair' });

  return ApiResponse.created(res, 'Repair entry created', repair);
});

const getRepairs = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { status, category, severity, wagon } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (severity) filter.severity = severity;
  if (wagon) filter.wagon = wagon;

  const [repairs, total] = await Promise.all([
    Repair.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('wagon', 'wagonNo type owner')
      .populate('assignedTo', 'name designation')
      .populate('createdBy', 'name')
      .lean(),
    Repair.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Repairs retrieved', repairs, buildPaginationMeta(total, page, limit));
});

const getRepair = asyncHandler(async (req, res) => {
  const repair = await Repair.findById(req.params.id)
    .populate('wagon', 'wagonNo type owner status')
    .populate('sickLine')
    .populate('assignedTo', 'name designation empCode')
    .populate('verifiedBy', 'name designation')
    .populate('createdBy', 'name')
    .lean();
  if (!repair) throw ApiError.notFound('Repair not found');
  return ApiResponse.success(res, 'Repair retrieved', repair);
});

const updateRepair = asyncHandler(async (req, res) => {
  const repair = await Repair.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!repair) throw ApiError.notFound('Repair not found');
  return ApiResponse.success(res, 'Repair updated', repair);
});

const completeRepair = asyncHandler(async (req, res) => {
  const repair = await Repair.findByIdAndUpdate(
    req.params.id,
    { status: 'Completed', completionDate: new Date() },
    { new: true, runValidators: true }
  );
  if (!repair) throw ApiError.notFound('Repair not found');
  return ApiResponse.success(res, 'Repair marked completed', repair);
});

const verifyRepair = asyncHandler(async (req, res) => {
  const repair = await Repair.findByIdAndUpdate(
    req.params.id,
    { status: 'Verified', verifiedBy: req.user._id, verifiedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('verifiedBy', 'name designation');
  if (!repair) throw ApiError.notFound('Repair not found');
  return ApiResponse.success(res, 'Repair verified', repair);
});

const deleteRepair = asyncHandler(async (req, res) => {
  const repair = await Repair.findByIdAndDelete(req.params.id);
  if (!repair) throw ApiError.notFound('Repair not found');
  return ApiResponse.success(res, 'Repair deleted');
});

module.exports = { createRepair, getRepairs, getRepair, updateRepair, completeRepair, verifyRepair, deleteRepair };
