const Workflow = require('../models/Workflow');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

exports.createWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.create(req.body);
  return ApiResponse.created(res, 'Workflow created', workflow);
});

exports.getWorkflows = asyncHandler(async (req, res) => {
  const workflows = await Workflow.find().lean();
  return ApiResponse.success(res, 'Workflows retrieved', workflows);
});

exports.getWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id).lean();
  if (!workflow) throw ApiError.notFound('Workflow not found');
  return ApiResponse.success(res, 'Workflow retrieved', workflow);
});

exports.updateWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!workflow) throw ApiError.notFound('Workflow not found');
  return ApiResponse.success(res, 'Workflow updated', workflow);
});

exports.deleteWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findByIdAndDelete(req.params.id);
  if (!workflow) throw ApiError.notFound('Workflow not found');
  return ApiResponse.success(res, 'Workflow deleted');
});
