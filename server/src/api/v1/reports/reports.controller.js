const service = require('./reports.service');

exports.attendance = async (req, res, next) => {
  try {
    const data = await service.getAttendanceReport(req.query);
    res.json(data);
  } catch (err) { next(err); }
};

exports.leave = async (req, res, next) => {
  try {
    const data = await service.getLeaveReport(req.query);
    res.json(data);
  } catch (err) { next(err); }
};

exports.payroll = async (req, res, next) => {
  try {
    const data = await service.getPayrollReport(req.query);
    res.json(data);
  } catch (err) { next(err); }
};

exports.headcount = async (req, res, next) => {
  try {
    const data = await service.getHeadcountReport(req.query);
    res.json(data);
  } catch (err) { next(err); }
};

// Placeholders for others
exports.pf = async (req, res) => res.json([]);
exports.profTax = async (req, res) => res.json([]);
exports.ytd = async (req, res) => res.json([]);
