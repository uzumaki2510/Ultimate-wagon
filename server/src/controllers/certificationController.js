const Certification = require('../models/Certification');
const Wagon = require('../models/Wagon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationMeta } = require('../middleware/pagination');

const createCertification = asyncHandler(async (req, res) => {
  const wagon = await Wagon.findById(req.body.wagon);
  if (!wagon) throw ApiError.notFound('Wagon not found');

  req.body.createdBy = req.user._id;
  const cert = await Certification.create(req.body);
  return ApiResponse.created(res, 'Certificate issued', cert);
});

const getCertifications = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = req.pagination;
  const { type, status, wagon } = req.query;

  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (wagon) filter.wagon = wagon;

  const [certs, total] = await Promise.all([
    Certification.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('wagon', 'wagonNo type owner')
      .populate('createdBy', 'name')
      .lean(),
    Certification.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, 'Certifications retrieved', certs, buildPaginationMeta(total, page, limit));
});

const getCertification = asyncHandler(async (req, res) => {
  const cert = await Certification.findById(req.params.id)
    .populate('wagon', 'wagonNo type owner status')
    .populate('inspections')
    .populate('createdBy', 'name')
    .lean();
  if (!cert) throw ApiError.notFound('Certification not found');
  return ApiResponse.success(res, 'Certification retrieved', cert);
});

const updateCertification = asyncHandler(async (req, res) => {
  const cert = await Certification.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!cert) throw ApiError.notFound('Certification not found');
  return ApiResponse.success(res, 'Certification updated', cert);
});

const revokeCertification = asyncHandler(async (req, res) => {
  const cert = await Certification.findByIdAndUpdate(
    req.params.id,
    {
      status: 'Revoked',
      revokedAt: new Date(),
      revokedBy: req.user.name,
      revokeReason: req.body.reason || '',
    },
    { new: true, runValidators: true }
  );
  if (!cert) throw ApiError.notFound('Certification not found');
  return ApiResponse.success(res, 'Certification revoked', cert);
});

const deleteCertification = asyncHandler(async (req, res) => {
  const cert = await Certification.findByIdAndDelete(req.params.id);
  if (!cert) throw ApiError.notFound('Certification not found');
  return ApiResponse.success(res, 'Certification deleted');
});

const getExpiringCertifications = asyncHandler(async (req, res) => {
  const daysAhead = parseInt(req.query.days, 10) || 30;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const certs = await Certification.find({
    status: 'Valid',
    expiryDate: { $lte: futureDate, $gte: new Date() },
  })
    .populate('wagon', 'wagonNo type owner')
    .sort({ expiryDate: 1 })
    .lean();

  return ApiResponse.success(res, `Certificates expiring within ${daysAhead} days`, certs);
});

module.exports = { createCertification, getCertifications, getCertification, updateCertification, revokeCertification, deleteCertification, getExpiringCertifications };
