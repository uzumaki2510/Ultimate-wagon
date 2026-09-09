const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/unused_security_test';
process.env.JWT_SECRET = 'test-access-key-not-for-production';
process.env.JWT_REFRESH_SECRET = 'test-refresh-key-not-for-production';
const User = require('../src/models/User');
const RefreshToken = require('../src/models/RefreshToken');
const Wagon = require('../src/models/Wagon');
const { protect } = require('../src/middleware/auth');
const { authorize } = require('../src/middleware/rbac');
const { generateAccessToken, generateRefreshToken } = require('../src/services/authService');
const { definitionFor, validateStages, completedPath } = require('../src/services/workflowRules');
const wagonValidation = require('../src/validations/wagonValidation');
const controller = require('../src/controllers/userController');
const auth = require('../src/controllers/authController');
let originals;
beforeEach(() => { originals = { findById: User.findById, findOne: User.findOne, create: User.create, tokenCreate: RefreshToken.create }; });
afterEach(() => { Object.assign(User, { findById: originals.findById, findOne: originals.findOne, create: originals.create }); RefreshToken.create = originals.tokenCreate; });
const user = (patch = {}) => ({ _id: '000000000000000000000001', name: 'Test employee', role: 'employee', status: 'approved', isActive: true, tokenVersion: 0, ...patch });
const authenticate = async account => {
  User.findById = () => ({ select: async () => account });
  const req = { headers: { authorization: `Bearer ${generateAccessToken(account._id)}` }, baseUrl: '/api/v1/wagons', path: '/' };
  let error;
  await protect(req, {}, e => { error = e; });
  return { req, error };
};
test('pending and rejected accounts cannot authenticate', async () => {
  for (const status of ['pending', 'rejected']) assert.equal((await authenticate(user({ status }))).error.statusCode, 403);
});
test('deactivated and revoked sessions are rejected', async () => {
  for (const patch of [{ isActive: false }, { tokenVersion: 1 }]) assert.equal((await authenticate(user(patch))).error.statusCode, 401);
});
test('approved employee retains permitted operations but cannot delete workflows', async () => {
  const { req, error } = await authenticate(user()); assert.equal(error, undefined);
  assert.doesNotThrow(() => authorize('wagons', 'C')(req, {}, () => {}));
  assert.throws(() => authorize('workflows', 'D')(req, {}, () => {}), /permission/);
});
test('temporary-password sessions cannot access operational APIs', async () => assert.equal((await authenticate(user({ forcePasswordChange: true }))).error.statusCode, 403));
test('registration creates pending account without issuing tokens', async () => {
  User.findOne = async () => null;
  User.create = async data => ({ toJSON: () => data });
  RefreshToken.create = () => { throw new Error('Must not issue session'); };
  let body;
  await auth.register({ body: { name: 'Test', email: 'test@example.invalid', password: 'long-passphrase' } }, { status() { return this; }, json(value) { body = value; } }, e => { throw e; });
  assert.equal(body.data.user.status, 'pending'); assert.equal(body.data.accessToken, undefined);
});
test('admin cannot reject a super admin', async () => {
  let saved = false;
  User.findById = async () => user({ role: 'super_admin', save: async () => { saved = true; } });
  let error;
  await controller.rejectUser({ params: { id: '000000000000000000000001' }, user: user({ role: 'admin' }) }, {}, e => { error = e; });
  assert.equal(error.statusCode, 403); assert.equal(saved, false);
});
test('maintenance fields survive request and model validation', () => {
  const patch = { expectedUpdatedAt: new Date().toISOString(), repairTasks: [{ id: 'task-1', category: 'Brake System', subRepair: 'Leak', severity: 'Normal', status: 'repaired', location: 'left', inspector: 'Tester' }], inspectionChecklist: { brakePipe: { checked: true, checkedBy: 'Tester' } }, fitConfirmation: { inspectorName: 'Tester', inspectorVerified: true } };
  const { value, error } = wagonValidation.update.validate(patch, { stripUnknown: true });
  assert.equal(error, undefined); assert.equal(value.repairTasks[0].status, 'repaired'); assert.equal(value.fitConfirmation.inspectorVerified, true);
  const model = new Wagon({ ...value, wagonNo: '12345678901', type: 'BTPN', owner: 'Test', createdBy: user()._id });
  assert.equal(model.validateSync(), undefined); assert.equal(model.repairTasks[0].inspector, 'Tester');
});
test('default wagon status is a valid arrival status', () => {
  const { value } = wagonValidation.create.validate({ wagonNo: '12345678901', type: 'BTPN', owner: 'Test' });
  assert.equal(value.status, 'ARRIVED'); assert.equal(new Wagon({ ...value, createdBy: user()._id }).validateSync(), undefined);
});
test('workflow refuses skipped prerequisites and direct completion', () => {
  const def = definitionFor('BOXN'); const stages = Object.keys(def.stages).map(stageName => ({ stageName, status: 'Pending' }));
  assert.throws(() => validateStages(stages, stages.map((s, i) => i === 1 ? { ...s, status: 'In Progress' } : s), def), /preceding/);
  assert.throws(() => validateStages(stages, stages.map((s, i) => i === 0 ? { ...s, status: 'Done', inspectorName: 'Test' } : s), def), /transition/);
  assert.equal(completedPath({ stages }, def), false);
});
test('refresh tokens are unique even when issued in the same second', () => assert.notEqual(generateRefreshToken(user()._id), generateRefreshToken(user()._id)));
