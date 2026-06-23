const SickLine = require('../models/SickLine');
const ROH = require('../models/ROH');
const Inspection = require('../models/Inspection');
const BrakeTest = require('../models/BrakeTest');
const Repair = require('../models/Repair');
const Certification = require('../models/Certification');
const Movement = require('../models/Movement');

/**
 * Get full lifecycle history for a wagon
 */
const getWagonHistory = async (wagonId) => {
  const [sickLines, rohs, inspections, brakeTests, repairs, certifications, movements] =
    await Promise.all([
      SickLine.find({ wagon: wagonId }).sort({ createdAt: -1 }).populate('assignedTo', 'name').lean(),
      ROH.find({ wagon: wagonId }).sort({ createdAt: -1 }).lean(),
      Inspection.find({ wagon: wagonId }).sort({ createdAt: -1 }).lean(),
      BrakeTest.find({ wagon: wagonId }).sort({ createdAt: -1 }).lean(),
      Repair.find({ wagon: wagonId }).sort({ createdAt: -1 }).populate('assignedTo', 'name').populate('verifiedBy', 'name').lean(),
      Certification.find({ wagon: wagonId }).sort({ createdAt: -1 }).lean(),
      Movement.find({ wagon: wagonId }).sort({ movedAt: -1 }).lean(),
    ]);

  return { sickLines, rohs, inspections, brakeTests, repairs, certifications, movements };
};

/**
 * Validate check digit for 11-digit wagon number
 */
const calculateCheckDigit = (wagonNumber) => {
  if (!wagonNumber || wagonNumber.length < 10) return -1;
  const digits = wagonNumber.slice(0, 10).split('').map(Number);

  const s1 = digits[1] + digits[3] + digits[5] + digits[7] + digits[9];
  const step2 = s1 * 3;
  const s2 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const s4 = step2 + s2;
  const remainder = s4 % 10;
  return remainder === 0 ? 0 : 10 - remainder;
};

/**
 * Validate wagon number format and check digit
 */
const validateWagonNumber = (wagonNo) => {
  const clean = wagonNo.replace(/[\s-]/g, '');
  if (clean.length !== 11 || !/^\d{11}$/.test(clean)) {
    return { valid: false, error: 'Wagon number must be 11 digits' };
  }
  const expected = calculateCheckDigit(clean);
  const actual = parseInt(clean[10], 10);
  return {
    valid: expected === actual,
    error: expected !== actual ? `Check digit mismatch: expected ${expected}, got ${actual}` : null,
  };
};

module.exports = { getWagonHistory, calculateCheckDigit, validateWagonNumber };
