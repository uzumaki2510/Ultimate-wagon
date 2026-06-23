const ROH = require('../models/ROH');
const Wagon = require('../models/Wagon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

// @desc    Create ROH record
// @route   POST /api/v1/roh
const createROH = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findById(req.body.wagon);
  if (!wagon) throw ApiError.notFound('Wagon not found');

  req.body.createdBy = req.user._id;
  const roh = await ROH.create(req.body);
  return ApiResponse.created(res, 'ROH record created', roh);
});

// @desc    Get all ROH records
// @route   GET /api/v1/roh
const getROHRecords = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { status, station } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (station) filter.station = { $regex: station, $options: 'i' };

  const [records, total] = await Promise.all([
    ROH.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('wagon', 'wagonNo type owner status')
      .populate('createdBy', 'name')
      .lean(),
    ROH.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'ROH records retrieved', records, buildPaginationMeta(total, page, limit));
});

// @desc    Get single ROH
// @route   GET /api/v1/roh/:id
const getROH = asyncHandler(async (req, res) => {
  const roh = await ROH.findById(req.params.id)
    .populate('wagon', 'wagonNo type owner status category')
    .populate('inspections')
    .populate('createdBy', 'name')
    .lean();
  if (!roh) throw ApiError.notFound('ROH record not found');
  return ApiResponse.success(res, 'ROH record retrieved', roh);
});

// @desc    Update ROH
// @route   PUT /api/v1/roh/:id
const updateROH = asyncHandler(async (req, res) => {
  const roh = await ROH.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!roh) throw ApiError.notFound('ROH record not found');
  return ApiResponse.success(res, 'ROH updated', roh);
});

// @desc    Start ROH
// @route   PUT /api/v1/roh/:id/start
const startROH = asyncHandler(async (req, res) => {
  const roh = await ROH.findByIdAndUpdate(
    req.params.id,
    { status: 'In Progress', startDate: new Date() },
    { new: true, runValidators: true }
  );
  if (!roh) throw ApiError.notFound('ROH record not found');

  await Wagon.findByIdAndUpdate(roh.wagon, { status: 'Under Repair' });

  return ApiResponse.success(res, 'ROH started', roh);
});

// @desc    Complete ROH
// @route   PUT /api/v1/roh/:id/complete
const completeROH = asyncHandler(async (req, res) => {
  const roh = await ROH.findByIdAndUpdate(
    req.params.id,
    {
      status: 'Completed',
      completionDate: new Date(),
      remarks: req.body.remarks || '',
    },
    { new: true, runValidators: true }
  );
  if (!roh) throw ApiError.notFound('ROH record not found');

  await Wagon.findByIdAndUpdate(roh.wagon, {
    status: 'Fit For Loading',
    lastROHDate: new Date(),
    rohStation: roh.station,
  });

  return ApiResponse.success(res, 'ROH completed', roh);
});

// @desc    Delete ROH
// @route   DELETE /api/v1/roh/:id
const deleteROH = asyncHandler(async (req, res) => {
  const roh = await ROH.findByIdAndDelete(req.params.id);
  if (!roh) throw ApiError.notFound('ROH record not found');
  return ApiResponse.success(res, 'ROH record deleted');
});

module.exports = { createROH, getROHRecords, getROH, updateROH, startROH, completeROH, deleteROH };
