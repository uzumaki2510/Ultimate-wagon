const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/reportService');
const ApiError = require('../utils/ApiError');

const getDailyReport = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const report = await reportService.getDailyReport(date);
  return ApiResponse.success(res, 'Daily report', report);
});

const getMonthlyReport = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

  if (month < 1 || month > 12) throw ApiError.badRequest('Month must be 1-12');

  const report = await reportService.getMonthlyReport(year, month);
  return ApiResponse.success(res, 'Monthly report', report);
});

const getWagonReport = asyncHandler(async (req, res) => {
  const report = await reportService.getWagonReport(req.params.wagonId);
  if (!report) throw ApiError.notFound('Wagon not found');
  return ApiResponse.success(res, 'Wagon report', report);
});

const getROHReport = asyncHandler(async (req, res) => {
  const report = await reportService.getROHReport();
  return ApiResponse.success(res, 'ROH report', report);
});

const getSickLineReport = asyncHandler(async (req, res) => {
  const report = await reportService.getSickLineReport();
  return ApiResponse.success(res, 'Sick line report', report);
});

module.exports = { getDailyReport, getMonthlyReport, getWagonReport, getROHReport, getSickLineReport };
