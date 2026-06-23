const Wagon = require('../models/Wagon');
const SickLine = require('../models/SickLine');
const ROH = require('../models/ROH');
const Inspection = require('../models/Inspection');
const BrakeTest = require('../models/BrakeTest');
const Repair = require('../models/Repair');
const Certification = require('../models/Certification');
const Movement = require('../models/Movement');

/**
 * Daily report: activity for a given date
 */
const getDailyReport = async (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const dateFilter = { createdAt: { $gte: start, $lte: end } };

  const [wagonsAdded, sickLineEntries, rohRecords, inspections, repairs, certifications, movements] =
    await Promise.all([
      Wagon.countDocuments(dateFilter),
      SickLine.countDocuments(dateFilter),
      ROH.countDocuments(dateFilter),
      Inspection.countDocuments(dateFilter),
      Repair.countDocuments(dateFilter),
      Certification.countDocuments(dateFilter),
      Movement.countDocuments(dateFilter),
    ]);

  return {
    date: start.toISOString().split('T')[0],
    wagonsAdded,
    sickLineEntries,
    rohRecords,
    inspections,
    repairs,
    certifications,
    movements,
  };
};

/**
 * Monthly report: aggregated stats for a month
 */
const getMonthlyReport = async (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const dateFilter = { createdAt: { $gte: start, $lte: end } };

  const [
    totalWagons,
    sickLineEntries,
    sickLineClosed,
    rohScheduled,
    rohCompleted,
    inspectionsDone,
    inspectionsPassed,
    inspectionsFailed,
    repairsCreated,
    repairsCompleted,
    certificationsIssued,
    totalMovements,
  ] = await Promise.all([
    Wagon.countDocuments(dateFilter),
    SickLine.countDocuments(dateFilter),
    SickLine.countDocuments({ ...dateFilter, status: 'Closed' }),
    ROH.countDocuments({ ...dateFilter, status: 'Scheduled' }),
    ROH.countDocuments({ ...dateFilter, status: 'Completed' }),
    Inspection.countDocuments(dateFilter),
    Inspection.countDocuments({ ...dateFilter, result: 'Pass' }),
    Inspection.countDocuments({ ...dateFilter, result: 'Fail' }),
    Repair.countDocuments(dateFilter),
    Repair.countDocuments({ ...dateFilter, status: 'Completed' }),
    Certification.countDocuments(dateFilter),
    Movement.countDocuments(dateFilter),
  ]);

  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    totalWagons,
    sickLine: { entries: sickLineEntries, closed: sickLineClosed },
    roh: { scheduled: rohScheduled, completed: rohCompleted },
    inspections: { total: inspectionsDone, passed: inspectionsPassed, failed: inspectionsFailed },
    repairs: { created: repairsCreated, completed: repairsCompleted },
    certifications: certificationsIssued,
    movements: totalMovements,
  };
};

/**
 * Wagon-wise report: all activity for a specific wagon
 */
const getWagonReport = async (wagonId) => {
  const wagon = await Wagon.findById(wagonId).lean();
  if (!wagon) return null;

  const [sickLineCount, rohCount, inspectionCount, repairCount, certCount, movementCount] =
    await Promise.all([
      SickLine.countDocuments({ wagon: wagonId }),
      ROH.countDocuments({ wagon: wagonId }),
      Inspection.countDocuments({ wagon: wagonId }),
      Repair.countDocuments({ wagon: wagonId }),
      Certification.countDocuments({ wagon: wagonId }),
      Movement.countDocuments({ wagon: wagonId }),
    ]);

  const lastInspection = await Inspection.findOne({ wagon: wagonId }).sort({ date: -1 }).lean();
  const lastRepair = await Repair.findOne({ wagon: wagonId }).sort({ createdAt: -1 }).lean();
  const activeCert = await Certification.findOne({ wagon: wagonId, status: 'Valid' }).sort({ issuedDate: -1 }).lean();

  return {
    wagon,
    summary: { sickLineCount, rohCount, inspectionCount, repairCount, certCount, movementCount },
    lastInspection,
    lastRepair,
    activeCertification: activeCert,
  };
};

/**
 * ROH summary report
 */
const getROHReport = async () => {
  const stats = await ROH.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const overdue = await ROH.countDocuments({
    status: { $in: ['Scheduled', 'In Progress'] },
    scheduledDate: { $lt: new Date() },
  });

  return {
    byStatus: stats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
    overdue,
    total: stats.reduce((sum, s) => sum + s.count, 0),
  };
};

/**
 * Sick line summary report
 */
const getSickLineReport = async () => {
  const byStatus = await SickLine.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const byReason = await SickLine.aggregate([
    { $group: { _id: '$reason', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const avgResolutionTime = await SickLine.aggregate([
    { $match: { status: 'Closed', closedAt: { $exists: true } } },
    {
      $project: {
        duration: { $subtract: ['$closedAt', '$entryDate'] },
      },
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$duration' },
      },
    },
  ]);

  return {
    byStatus: byStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
    topReasons: byReason,
    avgResolutionHours: avgResolutionTime.length > 0
      ? Math.round(avgResolutionTime[0].avgDuration / (1000 * 60 * 60) * 10) / 10
      : 0,
  };
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getWagonReport,
  getROHReport,
  getSickLineReport,
};
