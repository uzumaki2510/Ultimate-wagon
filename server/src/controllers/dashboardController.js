const Wagon = require('../models/Wagon');
const SickLine = require('../models/SickLine');
const ROH = require('../models/ROH');
const Repair = require('../models/Repair');
const Certification = require('../models/Certification');
const Inspection = require('../models/Inspection');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get dashboard analytics
// @route   GET /api/v1/dashboard/stats
const getStats = asyncHandler(async (req, res) => {
  const [
    totalWagons,
    activeWagons,
    sickWagons,
    underRepair,
    fitWagons,
    rohPending,
    rohOverdue,
    openSickLines,
    pendingRepairs,
    validCerts,
    expiringCerts,
    recentInspections,
  ] = await Promise.all([
    Wagon.countDocuments(),
    Wagon.countDocuments({ status: 'In Service' }),
    Wagon.countDocuments({ status: { $in: ['Sick Line', 'Cut Off'] } }),
    Wagon.countDocuments({ status: 'Under Repair' }),
    Wagon.countDocuments({ status: { $in: ['Fit For Loading', 'Fit'] } }),
    ROH.countDocuments({ status: 'Scheduled' }),
    ROH.countDocuments({
      status: { $in: ['Scheduled', 'In Progress'] },
      scheduledDate: { $lt: new Date() },
    }),
    SickLine.countDocuments({ status: { $in: ['Open', 'In Progress'] } }),
    Repair.countDocuments({ status: { $in: ['Pending', 'In Progress'] } }),
    Certification.countDocuments({ status: 'Valid' }),
    Certification.countDocuments({
      status: 'Valid',
      expiryDate: {
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        $gte: new Date(),
      },
    }),
    Inspection.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  // Wagon type distribution
  const typeDistribution = await Wagon.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Status distribution
  const statusDistribution = await Wagon.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return ApiResponse.success(res, 'Dashboard stats', {
    wagons: {
      total: totalWagons,
      active: activeWagons,
      sick: sickWagons,
      underRepair,
      fit: fitWagons,
    },
    roh: {
      pending: rohPending,
      overdue: rohOverdue,
    },
    sickLine: {
      open: openSickLines,
    },
    repairs: {
      pending: pendingRepairs,
    },
    certifications: {
      valid: validCerts,
      expiringSoon: expiringCerts,
    },
    inspections: {
      lastSevenDays: recentInspections,
    },
    distributions: {
      byType: typeDistribution,
      byStatus: statusDistribution,
    },
  });
});

// @desc    Get recent activity
// @route   GET /api/v1/dashboard/recent-activity
const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentWagons, recentSickLines, recentRepairs, recentInspections] = await Promise.all([
    Wagon.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).select('wagonNo type status createdAt').lean(),
    SickLine.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).populate('wagon', 'wagonNo').select('sickLineNo reason status createdAt wagon').lean(),
    Repair.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).populate('wagon', 'wagonNo').select('repairNo category status createdAt wagon').lean(),
    Inspection.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).populate('wagon', 'wagonNo').select('inspectionNo type result createdAt wagon').lean(),
  ]);

  return ApiResponse.success(res, 'Recent activity', {
    recentWagons,
    recentSickLines,
    recentRepairs,
    recentInspections,
  });
});

module.exports = { getStats, getRecentActivity };
