const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/unused_integration_test';
process.env.JWT_SECRET = 'integration-access-key-not-production';
process.env.JWT_REFRESH_SECRET = 'integration-refresh-key-not-production';
process.env.RATE_LIMIT_MAX = '10000';
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');
const User = require('../src/models/User');
const Wagon = require('../src/models/Wagon');
const Workflow = require('../src/models/Workflow');
const AuditLog = require('../src/models/AuditLog');
const RefreshToken = require('../src/models/RefreshToken');
const { generateAccessToken } = require('../src/services/authService');
const { definitionFor } = require('../src/services/workflowRules');
const app = require('../src/app');
let replica, token, admin;
before(async () => {
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' }, binary: { version: '7.0.14' } });
  await mongoose.connect(replica.getUri());
  await Promise.all([require('../src/models/WorkflowOperation').init(), require('../src/models/WagonDocument').init(), User.init(), Wagon.init(), Workflow.init(), AuditLog.init(), RefreshToken.init()]);
  admin = await User.create({ name: 'Test Admin', email: 'admin@example.com', password: 'long-test-passphrase', role: 'super_admin', status: 'approved' });
  token = generateAccessToken(admin._id);
}, { timeout: 120000 });
after(async () => { await mongoose.disconnect(); if (replica) await replica.stop(); });
beforeEach(async () => {
  admin = await User.findById(admin._id);
  token = generateAccessToken(admin._id, admin.tokenVersion);
});
const api = method => request(app)[method];
test('persistent wagon workflow, rejected bypasses, conflicts, and server audit', async () => {
  const created = await request(app).post('/api/v1/wagons').set('Authorization', `Bearer ${token}`).send({ wagonNo: '12345678901', type: 'BOXN', owner: 'Test Railway' });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  let wagon = created.body.data;
  const id = wagon._id;
  const workflowRes = await request(app).post('/api/v1/workflows').set('Authorization', `Bearer ${token}`).send({ wagonId: id, stages: [{ stageName: 'FAKE', status: 'Done' }] });
  assert.equal(workflowRes.status, 201, JSON.stringify(workflowRes.body));
  let workflow = workflowRes.body.data;
  assert.equal(workflow.stages[0].stageName, 'YARD_EXAM');
  wagon = (await request(app).get(`/api/v1/wagons/${id}`).set('Authorization', `Bearer ${token}`)).body.data;
  const bypass = await request(app).put(`/api/v1/wagons/${id}`).set('Authorization', `Bearer ${token}`).send({ status: 'FIT_READY', expectedUpdatedAt: wagon.updatedAt });
  assert.equal(bypass.status, 400);
  const stale = await request(app).put(`/api/v1/wagons/${id}`).set('Authorization', `Bearer ${token}`).send({ owner: 'New', expectedUpdatedAt: '2000-01-01T00:00:00Z' });
  assert.equal(stale.status, 409);
  const checkpoint = await request(app).put(`/api/v1/wagons/${id}`).set('Authorization', `Bearer ${token}`).send({ expectedUpdatedAt: wagon.updatedAt, inspectionChecklist: { brakePipe: { checked: true, checkedBy: 'Tester' } }, repairTasks: [{ id: 'r1', category: 'Brake System', subRepair: 'Leak', status: 'repaired', severity: 'Normal' }] });
  assert.equal(checkpoint.status, 200, JSON.stringify(checkpoint.body));
  assert.equal((await Wagon.findById(id)).repairTasks[0].status, 'repaired');
  for (const stageName of Object.keys(definitionFor('BOXN').stages)) {
    for (const status of ['In Progress', 'Done']) {
      const stages = workflow.stages.map(s => s.stageName === stageName ? { ...s, status, inspectorName: 'Test Admin' } : s);
      const response = await request(app).put(`/api/v1/workflows/${workflow._id}`).set('Authorization', `Bearer ${token}`).send({ expectedUpdatedAt: workflow.updatedAt, currentStage: stageName, stages });
      assert.equal(response.status, 200, JSON.stringify(response.body)); workflow = response.body.data;
    }
  }
  wagon = (await request(app).get(`/api/v1/wagons/${id}`).set('Authorization', `Bearer ${token}`)).body.data;
  assert.equal(wagon.status, 'FIT_CERTIFICATE_PENDING');
  const fit = await request(app).put(`/api/v1/wagons/${id}`).set('Authorization', `Bearer ${token}`).send({ expectedUpdatedAt: wagon.updatedAt, status: 'FIT_READY', fitConfirmation: { allStagesCompleted: true, defectRectified: true, finalInspectionCompleted: true, noSafetyCriticalDefectOpen: true, inspectorVerified: true, inspectorName: 'Spoofed inspector' } });
  assert.equal(fit.status, 200, JSON.stringify(fit.body));
  assert.equal(fit.body.data.fitConfirmation.inspectorName, admin.name);
  const tamper = await request(app).put(`/api/v1/wagons/${id}`).set('Authorization', `Bearer ${token}`).send({ expectedUpdatedAt: fit.body.data.updatedAt, fitConfirmation: { ...fit.body.data.fitConfirmation, inspectorName: 'Overwritten' } });
  assert.equal(tamper.status, 409);
  assert.equal((await Wagon.findById(id)).fitConfirmation.inspectorName, admin.name);
  assert.equal(await AuditLog.countDocuments({ action: 'Wagon created' }), 1);
  assert.equal(await AuditLog.countDocuments({ action: 'Wagon updated' }), 2);
  const forged = await request(app).post('/api/v1/audit-logs').set('Authorization', `Bearer ${token}`).send({ action: 'Forged success' });
  assert.equal(forged.status, 404);
});
test('employees cannot certify wagons and audit failure rolls back a write', async () => {
  const employee = await User.create({ name: 'Employee', email: 'employee@example.com', password: 'long-test-passphrase', role: 'employee', status: 'approved' });
  const employeeToken = generateAccessToken(employee._id);
  const wagon = await Wagon.findOne({ wagonNo: '12345678901' });
  const response = await request(app).put(`/api/v1/wagons/${wagon._id}`).set('Authorization', `Bearer ${employeeToken}`).send({ expectedUpdatedAt: wagon.updatedAt, status: 'FIT_READY' });
  assert.equal(response.status, 403);
  const write = require('../src/services/operationalWrite');
  const original = AuditLog.create;
  AuditLog.create = async () => { throw new Error('Simulated audit failure'); };
  try {
    await assert.rejects(write({ user: admin, body: {}, originalUrl: '/api/v1/wagons', baseUrl: '/api/v1/wagons', params: {}, ip: '127.0.0.1' }, 'Test rollback', async session => {
      const record = await Wagon.findById(wagon._id).session(session);
      record.owner = 'Must not persist';
      await record.save({ session });
      return record;
    }), /Simulated audit failure/);
    assert.equal((await Wagon.findById(wagon._id)).owner, wagon.owner);
  } finally { AuditLog.create = original; }
});
test('archived and deleted wagons remain recoverable through server APIs', async () => {
  const auth = `Bearer ${token}`;
  let response = await request(app).post('/api/v1/wagons').set('Authorization', auth).send({ wagonNo: '12345678902', type: 'BOXN', owner: 'Test Railway' });
  assert.equal(response.status, 201);
  const id = response.body.data._id;
  response = await request(app).put(`/api/v1/wagons/${id}`).set('Authorization', auth).send({ archived: true, expectedUpdatedAt: response.body.data.updatedAt });
  assert.equal(response.status, 200);
  const archived = await request(app).get('/api/v1/wagons?archived=true').set('Authorization', auth);
  assert.equal(archived.status, 200);
  assert.ok(archived.body.data.some(w => w._id === id));
  const visible = await request(app).get('/api/v1/wagons').set('Authorization', auth);
  assert.ok(!visible.body.data.some(w => w._id === id));
  assert.equal((await request(app).delete(`/api/v1/wagons/${id}`).set('Authorization', auth)).status, 200);
  const deleted = await request(app).get('/api/v1/wagons/deleted').set('Authorization', auth);
  assert.ok(deleted.body.data.some(w => w._id === id));
  assert.equal((await request(app).post(`/api/v1/wagons/${id}/restore`).set('Authorization', auth)).status, 200);
  assert.equal((await request(app).get(`/api/v1/wagons/${id}`).set('Authorization', auth)).status, 200);
});
test('refresh rotation uses HTTP-only cookie, rejects replay and logout revokes access', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'admin@example.com', password: 'long-test-passphrase' });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  const cookie = login.headers['set-cookie'][0];
  assert.match(cookie, /HttpOnly/); assert.equal(login.body.data.refreshToken, undefined);
  const refresh = await request(app).post('/api/v1/auth/refresh-token').set('Cookie', cookie).set('Origin', 'http://localhost:5173').send({});
  assert.equal(refresh.status, 200, JSON.stringify(refresh.body));
  const replay = await request(app).post('/api/v1/auth/refresh-token').set('Cookie', cookie).set('Origin', 'http://localhost:5173').send({});
  assert.equal(replay.status, 401);
  const access = refresh.body.data.accessToken;
  const logout = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${access}`).send({});
  assert.equal(logout.status, 200);
  assert.equal((await request(app).get('/api/v1/wagons').set('Authorization', `Bearer ${access}`)).status, 401);
});

test('atomic transitions are retry-safe and cannot skip branches', async () => {
  const auth = `Bearer ${token}`;
  const created = await request(app).post('/api/v1/wagons').set('Authorization', auth).send({ wagonNo: '12345678910', type: 'BOXN', owner: 'Test' });
  const wf = (await request(app).post('/api/v1/workflows').set('Authorization', auth).send({ wagonId: created.body.data._id })).body.data;
  const perform = body => request(app).post(`/api/v1/workflows/${wf._id}/transition`).set('Authorization', auth).send(body);
  const start = { operationId: 'start-atomic-123456789', action: 'start', stageName: 'YARD_EXAM', expectedUpdatedAt: wf.updatedAt };
  let response = await perform(start); assert.equal(response.status, 200, JSON.stringify(response.body));
  let current = response.body.data.workflow;
  const complete = { operationId: 'complete-atomic-123456', action: 'complete', stageName: 'YARD_EXAM', nextStage: 'SICK_MARKING', remarks: 'Checked', expectedUpdatedAt: current.updatedAt };
  const invalid = await perform({ ...complete, operationId: 'invalid-atomic-123456', nextStage: 'FIT_RELEASE' });
  assert.equal(invalid.status, 400);
  assert.equal((await Workflow.findById(wf._id)).stages[0].status, 'In Progress');
  response = await perform(complete); assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.data.workflow.currentStage, 'SICK_MARKING');
  const count = await AuditLog.countDocuments({ action: 'Workflow complete' });
  response = await perform(complete); assert.equal(response.status, 200);
  assert.equal(await AuditLog.countDocuments({ action: 'Workflow complete' }), count);
  assert.equal((await perform({ ...complete, remarks: 'Different request' })).status, 409);
});

test('assignments and handoffs persist with permissions, blockers and conflicts', async () => {
  const auth = `Bearer ${token}`;
  const wagon = await Wagon.findOne({ wagonNo: '12345678910' });
  const employee = await User.findOne({ email: 'employee@example.com' });
  let response = await request(app).patch(`/api/v1/wagons/${wagon._id}/assignment`).set('Authorization', auth).send({ expectedUpdatedAt: wagon.updatedAt, assigneeId: employee.id, dueAt: '2026-10-01T12:00:00Z', blockedReason: 'Waiting for parts', handoffNote: 'Inspect pipe' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.data.assignment.assigneeName, employee.name);
  assert.equal(response.body.data.assignmentHistory.length, 1);
  const wf = await Workflow.findOne({ wagonId: wagon._id });
  response = await request(app).post(`/api/v1/workflows/${wf._id}/transition`).set('Authorization', auth).send({ expectedUpdatedAt: wf.updatedAt, operationId: 'blocked-complete-12345', action: 'complete', stageName: 'SICK_MARKING', nextStage: 'REPAIR_ASSIGNMENT' });
  assert.equal(response.status, 409);
  assert.equal((await request(app).patch(`/api/v1/wagons/${wagon._id}/assignment`).set('Authorization', auth).send({ expectedUpdatedAt: wagon.updatedAt, blockedReason: '' })).status, 409);
  const latest = await Wagon.findById(wagon._id);
  response = await request(app).patch(`/api/v1/wagons/${wagon._id}/assignment`).set('Authorization', `Bearer ${generateAccessToken(employee._id)}`).send({ expectedUpdatedAt: latest.updatedAt, blockedReason: '', handoffNote: 'Parts available' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal((await Wagon.findById(wagon._id)).assignmentHistory.length, 2);
});

test('documents persist with versions, content validation, quarantine and protected downloads', async () => {
  const auth = `Bearer ${token}`;
  const wagon = await Wagon.findOne({ wagonNo: '12345678910' });
  const security = require('../src/services/documentSecurity');
  const originalScan = security.scan;
  const pdf = Buffer.from('%PDF-1.4\nTest fixture\n%%EOF');
  const upload = () => request(app).post(`/api/v1/documents/wagon/${wagon._id}?name=inspection.pdf&type=Inspection%20Report`).set('Authorization', auth).set('Content-Type', 'application/pdf').send(pdf);
  security.scan = async () => 'quarantined';
  try {
    let response = await upload(); assert.equal(response.status, 201, JSON.stringify(response.body));
    const first = response.body.data; assert.equal(first.version, 1); assert.equal(first.content, undefined);
    assert.equal((await request(app).get(`/api/v1/documents/${first._id}/content`).set('Authorization', auth)).status, 409);
    security.scan = async () => 'clean';
    response = await request(app).post(`/api/v1/documents/${first._id}/scan`).set('Authorization', auth);
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal((await request(app).get(`/api/v1/documents/${first._id}/content`)).status, 401);
    response = await request(app).get(`/api/v1/documents/${first._id}/content`).set('Authorization', auth);
    assert.equal(response.status, 200); assert.match(response.headers['content-disposition'], /attachment/);
    response = await upload(); assert.equal(response.status, 201); assert.equal(response.body.data.version, 2);
    const list = await request(app).get(`/api/v1/documents/wagon/${wagon._id}`).set('Authorization', auth);
    assert.equal(list.body.data.length, 2); assert.equal(list.body.data[0].content, undefined);
    response = await request(app).post(`/api/v1/documents/wagon/${wagon._id}?name=fake.pdf&type=Inspection%20Report`).set('Authorization', auth).set('Content-Type', 'application/pdf').send(Buffer.from('<script>bad</script>'));
    assert.equal(response.status, 400);
  } finally { security.scan = originalScan; }
});

test('reopening preserves certification and requires administrator reason', async () => {
  const wagon = await Wagon.findOne({ wagonNo: '12345678901' });
  const auth = `Bearer ${token}`;
  const employee = await User.findOne({ email: 'employee@example.com' });
  const url = `/api/v1/wagons/${wagon._id}/reopen`;
  assert.equal((await request(app).post(url).set('Authorization', `Bearer ${generateAccessToken(employee._id)}`).send({ expectedUpdatedAt: wagon.updatedAt, reason: 'Inspection review' })).status, 403);
  assert.equal((await request(app).post(url).set('Authorization', auth).send({ expectedUpdatedAt: wagon.updatedAt })).status, 400);
  const response = await request(app).post(url).set('Authorization', auth).send({ expectedUpdatedAt: wagon.updatedAt, reason: 'Inspection evidence requires review' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.data.status, 'SICK_LINE');
  assert.equal(response.body.data.fitConfirmation, undefined);
  assert.equal(response.body.data.certificationHistory[0].fitConfirmation.inspectorName, admin.name);
});

test('all workflow families and tank branch choices complete through atomic actions', async () => {
  const auth = `Bearer ${token}`;
  let counter = 100;
  for (const type of ['BOXN', 'BCNA', 'BVCM', 'BTPN', 'BTPGLN']) {
    const def = definitionFor(type);
    const branches = Math.max(...Object.values(def.stages).map(stage => stage.nextStages.length));
    for (let branch = 0; branch < branches; branch++) {
      const wagon = await Wagon.create({ wagonNo: String(12345679000 + counter++), type, owner: 'Test', createdBy: admin._id });
      let wf = (await request(app).post('/api/v1/workflows').set('Authorization', auth).send({ wagonId: wagon.id })).body.data;
      const perform = async (action, nextStage) => {
        const result = await request(app).post(`/api/v1/workflows/${wf._id}/transition`).set('Authorization', auth).send({ expectedUpdatedAt: wf.updatedAt, operationId: require('crypto').randomUUID(), action, stageName: wf.currentStage, nextStage, remarks: 'Verified process route and work evidence' });
        assert.equal(result.status, 200, JSON.stringify(result.body)); wf = result.body.data.workflow; return result.body.data.wagon;
      };
      await perform('start');
      let returned = false;
      for (let guard = 0; guard < 40; guard++) {
        const choices = def.stages[wf.currentStage].nextStages;
        let next = choices.length > 1 ? choices[branch % choices.length] : choices[0];
        if (type === 'BTPGLN' && wf.currentStage === 'PURGING') { next = returned ? 'HAPA_YARD_EXAM' : 'HAPA_DEPOT'; returned = true; }
        const saved = await perform('complete', next);
        assert.ok(wf.stages.filter(s => s.status === 'In Progress').length <= 1);
        if (!next) { assert.equal(saved.status, 'FIT_CERTIFICATE_PENDING'); if (type === 'BTPGLN') { assert.equal(wf.cycleHistory.length, 1); assert.ok(wf.cycleHistory[0].stages.some(s => s.stageName === 'PURGING' && s.status === 'Done')); } break; }
        assert.ok(guard < 39, 'Workflow must reach its final stage');
      }
    }
  }
});

test('pause/resume are persisted and audit failure rolls back atomic completion and receipt', async () => {
  const wagon = await Wagon.findOne({ wagonNo: '12345678910' });
  let wf = await Workflow.findOne({ wagonId: wagon.id });
  const auth = `Bearer ${token}`;
  const send = body => request(app).post(`/api/v1/workflows/${wf.id}/transition`).set('Authorization', auth).send({ expectedUpdatedAt: wf.updatedAt, operationId: require('crypto').randomUUID(), stageName: wf.currentStage, ...body });
  let response = await send({ action: 'pause', remarks: 'Shift break' }); assert.equal(response.status, 200);
  wf = await Workflow.findById(wf.id); assert.ok(wf.stages.find(s => s.stageName === wf.currentStage).pausedAt);
  response = await send({ action: 'resume' }); assert.equal(response.status, 200);
  wf = await Workflow.findById(wf.id);
  const receipts = await require('../src/models/WorkflowOperation').countDocuments({});
  const original = AuditLog.create; AuditLog.create = async () => { throw new Error('Simulated transition audit failure'); };
  try {
    response = await send({ action: 'complete', nextStage: definitionFor(wagon.type).stages[wf.currentStage].nextStages[0] });
    assert.equal(response.status, 500);
    assert.equal((await Workflow.findById(wf.id)).updatedAt.getTime(), wf.updatedAt.getTime());
    assert.equal(await require('../src/models/WorkflowOperation').countDocuments({}), receipts);
  } finally { AuditLog.create = original; }
});

test('integrity review is read-only and reconciliation preserves evidence without inventing completion', async () => {
  const wagon = await Wagon.create({ wagonNo: '12345679990', type: 'BOXN', owner: 'Legacy', createdBy: admin._id });
  const def = definitionFor('BOXN');
  let wf = await Workflow.create({ wagonId: wagon.id, currentStage: def.stages.YARD_EXAM.label, stages: [{ stageName: def.stages.YARD_EXAM.label, status: 'Done', inspectorName: 'Legacy inspector', completedAt: new Date('2025-01-01') }] });
  const auth = `Bearer ${token}`;
  const review = await request(app).get('/api/v1/workflows/integrity').set('Authorization', auth);
  assert.equal(review.status, 200); assert.ok(review.body.data.find(item => item.workflowId === wf.id).canNormalize);
  assert.equal((await Workflow.findById(wf.id)).updatedAt.getTime(), wf.updatedAt.getTime());
  const response = await request(app).post(`/api/v1/workflows/${wf.id}/reconcile`).set('Authorization', auth).send({ expectedUpdatedAt: wf.updatedAt, reason: 'Verified legacy labels against saved records' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const stages = response.body.data.stages;
  assert.equal(stages.find(s => s.stageName === 'YARD_EXAM').inspectorName, 'Legacy inspector');
  assert.equal(stages.filter(s => s.status === 'Done').length, 1);
  assert.equal(stages.filter(s => s.status === 'Pending').length, Object.keys(def.stages).length - 1);
  wf = await Workflow.findById(wf.id); wf.stages.push({ stageName: 'UNKNOWN', status: 'Done' }); await wf.save();
  assert.equal((await request(app).post(`/api/v1/workflows/${wf.id}/reconcile`).set('Authorization', auth).send({ expectedUpdatedAt: wf.updatedAt, reason: 'Ambiguous data' })).status, 409);
});

test('document scanner protocol accepts only explicit clean results', async () => {
  const net = require('net'); const security = require('../src/services/documentSecurity');
  const savedHost = process.env.CLAMAV_HOST, savedPort = process.env.CLAMAV_PORT;
  const scanner = net.createServer();
  try {
    delete process.env.CLAMAV_HOST; assert.equal(await security.scan(Buffer.from('fixture')), 'quarantined');
    let reply = 'stream: OK\0'; let received;
    scanner.on('connection', socket => {
      let data = Buffer.alloc(0);
      socket.on('data', chunk => {
        data = Buffer.concat([data, chunk]);
        const expected = 10 + 4 + 7 + 4;
        if (data.length >= expected) { received = data; socket.end(reply); }
      });
    });
    await new Promise(resolve => scanner.listen(0, '127.0.0.1', resolve));
    process.env.CLAMAV_HOST = '127.0.0.1'; process.env.CLAMAV_PORT = String(scanner.address().port);
    assert.equal(await security.scan(Buffer.from('fixture')), 'clean');
    assert.equal(received.subarray(0, 10).toString(), 'zINSTREAM\0');
    reply = 'stream: harmless-test FOUND\0'; assert.equal(await security.scan(Buffer.from('fixture')), 'rejected');
    reply = 'unknown response\0'; await assert.rejects(security.scan(Buffer.from('fixture')));
  } finally {
    await new Promise(resolve => scanner.close(resolve));
    savedHost === undefined ? delete process.env.CLAMAV_HOST : process.env.CLAMAV_HOST = savedHost;
    savedPort === undefined ? delete process.env.CLAMAV_PORT : process.env.CLAMAV_PORT = savedPort;
  }
});
