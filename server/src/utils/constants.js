// ── Roles ────────────────────────────────────────────────
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
};

const ROLE_LIST = Object.values(ROLES);

// ── User Statuses ────────────────────────────────────────
const USER_STATUSES = ['pending', 'approved', 'rejected'];

// ── Wagon Types ──────────────────────────────────────────
const WAGON_TYPES = [
  'BTPGLN', 'BTPN', 'BTPFLN', 'BTPNHS',
  'BOXN', 'BOXNHA', 'BOXNHS', 'BOXNCR', 'BOXNLW', 'BOXNB', 'BOXNF', 'BOXNG', 'BOY', 'BOST', 'BOXNAL', 'BOXN-HL',
  'BCNA', 'BCNAHS', 'BCCNR', 'BCN-HL', 'BCNMI',
  'BTALN', 'BTCS', 'BTPH', 'BTAP', 'BTFLN',
  'BRNA', 'BRNAHS', 'BFNS', 'BOMN', 'BRSTH', 'BFAT', 'BLCA', 'BLCB',
  'BOBYN', 'BOBYNHS', 'BOBRN', 'BOBRNHS', 'BOBRAL',
  'BWTB',
  'BVZC', 'BVZI', 'BVCM',
  'Other',
];

const WAGON_CATEGORIES = [
  'Open Wagon', 'Covered Wagon', 'Tank Wagon', 'Flat Wagon',
  'Hopper Wagon', 'Well Wagon', 'Brake Van', 'Other',
];

// ── Wagon Statuses ───────────────────────────────────────
const WAGON_STATUSES = [
  'ARRIVED', 'INSPECTION_PENDING', 'INSPECTION_COMPLETE',
  'SICK_LINE', 'REPAIR_IN_PROGRESS', 'REPAIR_COMPLETE',
  'FIT_CERTIFICATE_PENDING', 'FIT_READY', 'RELEASED',
];

// ── Priority Levels ──────────────────────────────────────
const PRIORITY_LEVELS = ['Normal', 'Urgent', 'Safety Critical'];

// ── Sick Line Reasons ────────────────────────────────────
const SICK_REASONS = [
  'Wheel Alert', 'Bearing Alert', 'Under Gear Defect', 'Upper Gear Defect',
  'ROH Due', 'POH Due', 'Brake Binding', 'Air Leakage', 'CBC Defect',
  'Valve Defect', 'Barrel Defect', 'Ladder Defect', 'Delivery Pipe Defect',
  'Master Valve Defect', 'Other',
];

// ── Booked To ────────────────────────────────────────────
const BOOKED_TO = [
  'HAPA SL', 'HAPA YD', 'MV Shed', 'TXR Point',
  'Yard Examination', 'Fit For Loading', 'Other',
];

// ── Sick Line Positions ──────────────────────────────────
const SICK_LINES = ['line1', 'line2', 'line3', 'line4', 'mv_shed', 'steam_point', 'yard'];

// ── Sick Line Statuses ───────────────────────────────────
const SICK_LINE_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

// ── ROH Statuses ─────────────────────────────────────────
const ROH_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Overdue'];

// ── Inspection Types ─────────────────────────────────────
const INSPECTION_TYPES = ['Yard', 'Periodic', 'Final', 'Safety', 'ROH'];

// ── Inspection Results ───────────────────────────────────
const INSPECTION_RESULTS = ['Pass', 'Fail', 'Conditional'];

// ── Brake Test Types ─────────────────────────────────────
const BRAKE_TEST_TYPES = ['Brake Power', 'Air Brake', 'Single Wagon'];

// ── Brake Test Results ───────────────────────────────────
const BRAKE_TEST_RESULTS = ['Pass', 'Fail'];

// ── Repair Categories ────────────────────────────────────
const REPAIR_CATEGORIES = [
  'Wheel & Axle', 'Brake System', 'Coupler / CBC / Draft Gear',
  'Body & Structure', 'Underframe', 'Bogie & Suspension',
  'Tank Wagon Work', 'Painting / Finishing', 'Scheduled Maintenance',
];

// ── Repair Statuses ──────────────────────────────────────
const REPAIR_STATUSES = ['Pending', 'In Progress', 'Completed', 'Verified'];

// ── Certification Types ──────────────────────────────────
const CERTIFICATION_TYPES = ['Fitness', 'ROH Completion', 'Safety', 'Brake'];

// ── Certification Statuses ───────────────────────────────
const CERTIFICATION_STATUSES = ['Valid', 'Expired', 'Revoked'];

// ── Movement Statuses ────────────────────────────────────
const MOVEMENT_STATUSES = ['In Transit', 'Arrived', 'Stationed'];

// ── Notification Types ───────────────────────────────────
const NOTIFICATION_TYPES = [
  'ROH_DUE', 'POH_DUE', 'CERT_EXPIRING', 'REPAIR_ASSIGNED',
  'INSPECTION_REQUIRED', 'WAGON_STATUS_CHANGE', 'SYSTEM',
];

// ── Approval Roles ───────────────────────────────────────
const APPROVAL_ROLES = ['SSE / JE', 'TXR Staff', 'Yard Master', 'Operating Department'];

// ── Railway Zones ────────────────────────────────────────
const RAILWAY_ZONES = [
  'Central Railway', 'Eastern Railway', 'Northern Railway',
  'North East Railway', 'Northeast Frontier Railway', 'Southern Railway',
  'South Eastern Railway', 'Western Railway', 'South Central Railway',
  'East Central Railway', 'North Western Railway', 'East Coast Railway',
  'North Central Railway', 'South East Central Railway',
  'South Western Railway', 'West Central Railway', 'CONCOR', 'Private Parties',
];

// ── RBAC Permissions ─────────────────────────────────────
// C = Create, R = Read, U = Update, D = Delete
const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: { users: 'CRUD', admin: 'CRUD', wagons: 'CRUD', sickLine: 'CRUD', roh: 'CRUD', inspections: 'CRUD', brakeTests: 'CRUD', repairs: 'CRUD', certifications: 'CRUD', movements: 'CRUD', reports: 'CRUD', dashboard: 'R' },
  [ROLES.ADMIN]:       { users: 'CRU',  admin: 'R',    wagons: 'CRUD', sickLine: 'CRUD', roh: 'CRUD', inspections: 'CRUD', brakeTests: 'CRUD', repairs: 'CRUD', certifications: 'CRUD', movements: 'CRUD', reports: 'R',    dashboard: 'R' },
  [ROLES.EMPLOYEE]:    { users: 'R',    admin: '',     wagons: 'CR',   sickLine: 'CRU',  roh: 'CRU',  inspections: 'CRU',  brakeTests: 'CRU',  repairs: 'CRU',  certifications: 'CRU',  movements: 'CRU',  reports: 'R',    dashboard: 'R' },
};

module.exports = {
  ROLES, ROLE_LIST, USER_STATUSES,
  WAGON_TYPES, WAGON_CATEGORIES, WAGON_STATUSES,
  PRIORITY_LEVELS, SICK_REASONS, BOOKED_TO, SICK_LINES,
  SICK_LINE_STATUSES, ROH_STATUSES,
  INSPECTION_TYPES, INSPECTION_RESULTS,
  BRAKE_TEST_TYPES, BRAKE_TEST_RESULTS,
  REPAIR_CATEGORIES, REPAIR_STATUSES,
  CERTIFICATION_TYPES, CERTIFICATION_STATUSES,
  MOVEMENT_STATUSES, NOTIFICATION_TYPES,
  APPROVAL_ROLES, RAILWAY_ZONES, PERMISSIONS,
};
