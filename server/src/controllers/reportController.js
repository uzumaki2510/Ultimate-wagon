const Wagon = require('../models/Wagon');
const Repair = require('../models/Repair');
const Inspection = require('../models/Inspection');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const PDFService = require('../services/pdfService');
const ExcelService = require('../services/excelService');
const { auditLogAction } = require('../utils/auditLogger');

// ── Dashboard Stats ──────────────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalWagons = await Wagon.countDocuments();
  const pendingRepairs = await Repair.countDocuments({ status: { $in: ['pending', 'in_progress'] } });
  const completedRepairs = await Repair.countDocuments({ status: 'completed' });
  const sickLineWagons = await Wagon.countDocuments({ status: 'Sick' });

  // Mocking ROH, Inspections Due, and Certs for now
  const rohWagons = 0; 
  const inspectionsDue = await Inspection.countDocuments({ status: 'pending' });
  const expiringCerts = 0;

  // Monthly Activity (Repairs completed per month for the last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyActivity = await Repair.aggregate([
    { $match: { status: 'completed', completedAt: { $gte: sixMonthsAgo } } },
    { $group: {
        _id: { month: { $month: '$completedAt' }, year: { $year: '$completedAt' } },
        count: { $sum: 1 }
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const formattedMonthlyActivity = monthlyActivity.map(m => ({
    name: `${m._id.month}/${m._id.year}`,
    repairs: m.count
  }));

  return ApiResponse.success(res, 'Dashboard stats', {
    totalWagons,
    pendingRepairs,
    completedRepairs,
    sickLineWagons,
    rohWagons,
    inspectionsDue,
    expiringCerts,
    monthlyActivity: formattedMonthlyActivity
  });
});

// ── Generic List Handlers for Previews ───────────────────────────────────────
const buildFilters = (query) => {
  const filters = {};
  if (query.wagonNumber) filters.wagonNumber = { $regex: query.wagonNumber, $options: 'i' };
  if (query.status) filters.status = query.status;
  if (query.department) filters.department = query.department;
  if (query.fromDate && query.toDate) {
    filters.createdAt = { $gte: new Date(query.fromDate), $lte: new Date(query.toDate) };
  }
  return filters;
};

const getWagonsReport = asyncHandler(async (req, res) => {
  const filters = buildFilters(req.query);
  const wagons = await Wagon.find(filters).limit(100).lean();
  return ApiResponse.success(res, 'Wagons', wagons);
});

const getRepairsReport = asyncHandler(async (req, res) => {
  const filters = buildFilters(req.query);
  const repairs = await Repair.find(filters).populate('wagon', 'wagonNumber').limit(100).lean();
  return ApiResponse.success(res, 'Repairs', repairs);
});

const getInspectionsReport = asyncHandler(async (req, res) => {
  const filters = buildFilters(req.query);
  const inspections = await Inspection.find(filters).populate('wagon', 'wagonNumber').limit(100).lean();
  return ApiResponse.success(res, 'Inspections', inspections);
});

const getEmployeesReport = asyncHandler(async (req, res) => {
  const filters = buildFilters(req.query);
  const employees = await User.find(filters).limit(100).lean();
  return ApiResponse.success(res, 'Employees', employees);
});

const getAuditLogsReport = asyncHandler(async (req, res) => {
  const filters = buildFilters(req.query);
  if (query.action) filters.action = query.action;
  const logs = await AuditLog.find(filters).populate('performedBy', 'name email').limit(100).sort('-createdAt').lean();
  return ApiResponse.success(res, 'Audit Logs', logs);
});

// ── Export Generators ────────────────────────────────────────────────────────
const fetchDataForExport = async (type, query) => {
  const filters = buildFilters(query);
  let headers = [];
  let rows = [];

  switch (type) {
    case 'wagons':
      headers = ['Wagon Number', 'Type', 'Status', 'Location', 'Base Depot'];
      const wagons = await Wagon.find(filters).lean();
      rows = wagons.map(w => [w.wagonNumber, w.type, w.status, w.currentLocation, w.baseDepot]);
      break;
    case 'repairs':
      headers = ['Repair ID', 'Wagon Number', 'Type', 'Status', 'Date'];
      const repairs = await Repair.find(filters).populate('wagon', 'wagonNumber').lean();
      rows = repairs.map(r => [r.repairId || r._id, r.wagon?.wagonNumber, r.repairType, r.status, new Date(r.createdAt).toLocaleDateString()]);
      break;
    case 'employees':
      headers = ['Name', 'Email', 'Role', 'Department', 'Status'];
      const employees = await User.find(filters).lean();
      rows = employees.map(e => [e.name, e.email, e.role, e.department, e.status]);
      break;
    case 'audit-logs':
      headers = ['Date', 'Action', 'Performed By'];
      const logs = await AuditLog.find(filters).populate('performedBy', 'name').lean();
      rows = logs.map(l => [new Date(l.createdAt).toLocaleString(), l.action, l.performedBy?.name || 'System']);
      break;
    default:
      throw new Error('Invalid report type');
  }

  return { headers, rows };
};

const exportPDF = asyncHandler(async (req, res) => {
  const { type, ...filters } = req.body;
  const data = await fetchDataForExport(type, filters);
  
  await auditLogAction(req.user._id, `Exported PDF Report: ${type}`, null, req);

  const pdfBuffer = await PDFService.generateReport({
    title: `${type.toUpperCase()} REPORT`,
    user: req.user,
    headers: data.headers,
    rows: data.rows
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=wagon-whisper-${type}-report.pdf`);
  res.send(pdfBuffer);
});

const exportExcel = asyncHandler(async (req, res) => {
  const { type, ...filters } = req.body;
  const data = await fetchDataForExport(type, filters);

  await auditLogAction(req.user._id, `Exported Excel Report: ${type}`, null, req);

  const excelBuffer = await ExcelService.generateWorkbook({
    title: `${type.toUpperCase()} REPORT`,
    user: req.user,
    filters: filters,
    headers: data.headers,
    rows: data.rows
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=wagon-whisper-${type}-report.xlsx`);
  res.send(excelBuffer);
});

module.exports = {
  getDashboardStats,
  getWagonsReport,
  getRepairsReport,
  getInspectionsReport,
  getEmployeesReport,
  getAuditLogsReport,
  exportPDF,
  exportExcel
};
