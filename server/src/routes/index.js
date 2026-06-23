const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./users');
const adminRoutes = require('./admin');
const wagonRoutes = require('./wagons');
const sickLineRoutes = require('./sickLine');
const rohRoutes = require('./roh');
const inspectionRoutes = require('./inspections');
const brakeTestRoutes = require('./brakeTests');
const repairRoutes = require('./repairs');
const certificationRoutes = require('./certifications');
const movementRoutes = require('./movements');
const reportRoutes = require('./reports');
const dashboardRoutes = require('./dashboard');
const memoRoutes = require('./memos');
const workflowRoutes = require('./workflows');
const rakeRoutes = require('./rakes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/wagons', wagonRoutes);
router.use('/sick-line', sickLineRoutes);
router.use('/roh', rohRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/brake-tests', brakeTestRoutes);
router.use('/repairs', repairRoutes);
router.use('/certifications', certificationRoutes);
router.use('/movements', movementRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/memos', memoRoutes);
router.use('/workflows', workflowRoutes);
router.use('/rakes', rakeRoutes);

module.exports = router;
