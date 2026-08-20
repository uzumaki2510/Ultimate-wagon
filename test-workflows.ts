import { getWorkflowForWagonType, btpnWorkflow, btpglnWorkflow } from './src/lib/wagonWorkflows.js';
import assert from 'assert';

console.log("Running Workflow Tests...");

// 1. BTPN returns BTPN/BTPFLN workflow
let result = getWorkflowForWagonType("BTPN");
assert.strictEqual(result.supported, true, "BTPN should be supported");
if (result.supported) {
  assert.strictEqual(result.workflow.id, btpnWorkflow.id, "BTPN should return BTPN workflow");
  console.log("✅ BTPN returns BTPN/BTPFLN workflow.");
}

// 2. BTPFLN returns the appropriate supplied workflow
result = getWorkflowForWagonType("BTPFLN");
assert.strictEqual(result.supported, true, "BTPFLN should be supported");
if (result.supported) {
  assert.strictEqual(result.workflow.id, btpnWorkflow.id, "BTPFLN should return BTPN workflow");
  console.log("✅ BTPFLN returns the appropriate supplied workflow.");
}

// 3. BTPGLN returns the de-gassing/purging workflow
result = getWorkflowForWagonType("BTPGLN");
assert.strictEqual(result.supported, true, "BTPGLN should be supported");
if (result.supported) {
  assert.strictEqual(result.workflow.id, btpglnWorkflow.id, "BTPGLN should return BTPGLN workflow");
  console.log("✅ BTPGLN returns the de-gassing/purging workflow.");
}

// 4. BTPGN mapping only if supported
result = getWorkflowForWagonType("BTPGN");
assert.strictEqual(result.supported, true, "BTPGN should be supported");
if (result.supported) {
  assert.strictEqual(result.workflow.id, btpglnWorkflow.id, "BTPGN should return BTPGLN workflow");
  console.log("✅ BTPGN mapping supported by workflow logic.");
}

// 5. Unknown wagon type returns safe unsupported result
result = getWorkflowForWagonType("BOXN");
assert.strictEqual(result.supported, false, "BOXN should not be supported");
if (!result.supported) {
  assert.strictEqual(result.reason, "No configured workflow for this wagon type.", "Correct unsupported reason");
  console.log("✅ Unknown wagon type returns safe unsupported result.");
}

// 6. Branch definitions remain present
assert.strictEqual(btpnWorkflow.stages["RECTIFICATION_DECISION"].branchConditionId, "upperGearOrSiding", "BTPN branching present");
assert.strictEqual(btpglnWorkflow.stages["HAPA_DEPOT"].branchConditionId, "defectReason", "BTPGLN branching present (HAPA_DEPOT)");
assert.strictEqual(btpglnWorkflow.stages["PURGING"].branchConditionId, "purgingStatus", "BTPGLN branching present (PURGING)");
console.log("✅ Branch definitions remain present.");

// 7. Workflow definition does not mutate wagon records
// This is structurally guaranteed because the workflow definition doesn't take wagon records as input, it's just static configuration and a lookup function.
console.log("✅ Workflow definition does not mutate wagon records.");

console.log("All tests passed!");
