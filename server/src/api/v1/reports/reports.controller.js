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

exports.pf = async (req, res, next) => {
  try {
    const data = await service.getPfReport(req.query);
    res.json(data);
  } catch (err) { next(err); }
};

exports.profTax = async (req, res, next) => {
  try {
    const data = await service.getProfTaxReport(req.query);
    res.json(data);
  } catch (err) { next(err); }
};

exports.ytd = async (req, res, next) => {
  try {
    const data = await service.getYtdReport(req.query);
    res.json(data);
  } catch (err) { next(err); }
};
