const SickLine = require('../models/SickLine');
const Wagon = require('../models/Wagon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

// @desc    Create sick line entry
// @route   POST /api/v1/sick-line
const createSickLine = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findById(req.body.wagon);
  if (!wagon) throw ApiError.notFound('Wagon not found');

  req.body.createdBy = req.user._id;
  const entry = await SickLine.create(req.body);

  // Update wagon status to Sick Line
  await Wagon.findByIdAndUpdate(req.body.wagon, { status: 'Sick Line' });

  return ApiResponse.created(res, 'Sick line entry created', entry);
});

// @desc    Get all sick line entries
// @route   GET /api/v1/sick-line
const getSickLines = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { status, reason, sickLine } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (reason) filter.reason = reason;
  if (sickLine) filter.sickLine = sickLine;

  const [entries, total] = await Promise.all([
    SickLine.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('wagon', 'wagonNo type owner status')
      .populate('assignedTo', 'name designation')
      .populate('createdBy', 'name')
      .lean(),
    SickLine.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Sick line entries retrieved', entries, buildPaginationMeta(total, page, limit));
});

// @desc    Get single entry
// @route   GET /api/v1/sick-line/:id
const getSickLineEntry = asyncHandler(async (req, res) => {
  const entry = await SickLine.findById(req.params.id)
    .populate('wagon', 'wagonNo type owner status category')
    .populate('assignedTo', 'name designation empCode')
    .populate('createdBy', 'name')
    .lean();
  if (!entry) throw ApiError.notFound('Sick line entry not found');
  return ApiResponse.success(res, 'Sick line entry retrieved', entry);
});

// @desc    Update entry
// @route   PUT /api/v1/sick-line/:id
const updateSickLine = asyncHandler(async (req, res) => {
  const entry = await SickLine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('wagon', 'wagonNo type owner status');
  if (!entry) throw ApiError.notFound('Sick line entry not found');
  return ApiResponse.success(res, 'Sick line entry updated', entry);
});

// @desc    Assign repair staff
// @route   PUT /api/v1/sick-line/:id/assign
const assignRepairStaff = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  if (!assignedTo) throw ApiError.badRequest('assignedTo is required');

  const entry = await SickLine.findByIdAndUpdate(
    req.params.id,
    { assignedTo, status: 'In Progress' },
    { new: true, runValidators: true }
  ).populate('assignedTo', 'name designation');
  if (!entry) throw ApiError.notFound('Sick line entry not found');

  // Update wagon status
  await Wagon.findByIdAndUpdate(entry.wagon, { status: 'Under Repair' });

  return ApiResponse.success(res, 'Repair staff assigned', entry);
});

// @desc    Close sick line case
// @route   PUT /api/v1/sick-line/:id/close
const closeSickLine = asyncHandler(async (req, res) => {
  const entry = await SickLine.findByIdAndUpdate(
    req.params.id,
    {
      status: 'Closed',
      closedAt: new Date(),
      remarks: req.body.remarks || '',
    },
    { new: true, runValidators: true }
  );
  if (!entry) throw ApiError.notFound('Sick line entry not found');

  // Update wagon status to Fit For Loading
  await Wagon.findByIdAndUpdate(entry.wagon, { status: 'Fit For Loading' });

  return ApiResponse.success(res, 'Sick line case closed', entry);
});

// @desc    Delete entry
// @route   DELETE /api/v1/sick-line/:id
const deleteSickLine = asyncHandler(async (req, res) => {
  const entry = await SickLine.findByIdAndDelete(req.params.id);
  if (!entry) throw ApiError.notFound('Sick line entry not found');
  return ApiResponse.success(res, 'Sick line entry deleted');
});

module.exports = { createSickLine, getSickLines, getSickLineEntry, updateSickLine, assignRepairStaff, closeSickLine, deleteSickLine };
