const service = require('./reports.service');

exports.getAttendanceReport = async (req, res, next) => {
  try { res.json(await service.getAttendanceReport()); } catch(e) { next(e); }
};

exports.getLeaveReport = async (req, res, next) => {
  try { res.json(await service.getLeaveReport()); } catch(e) { next(e); }
};

exports.getPayrollReport = async (req, res, next) => {
  try { res.json(await service.getPayrollReport()); } catch(e) { next(e); }
};

exports.getHeadcountReport = async (req, res, next) => {
  try { res.json(await service.getHeadcountReport()); } catch(e) { next(e); }
};

exports.getPfReport = async (req, res, next) => {
  try { res.json(await service.getPfReport()); } catch(e) { next(e); }
};

exports.getProfTaxReport = async (req, res, next) => {
  try { res.json(await service.getProfTaxReport()); } catch(e) { next(e); }
};

exports.getYtdReport = async (req, res, next) => {
  try { res.json(await service.getYtdReport()); } catch(e) { next(e); }
};
