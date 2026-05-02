const service = require('./payslips.service');

exports.getPayslips = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await service.getEmployeePayslips(req.user.id, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (e) { next(e); }
};

exports.getPayslipDetail = async (req, res, next) => {
  try {
    const payslip = await service.getPayslipDetail(req.user.id, req.params.id);
    res.json({ payslip });
  } catch (e) { next(e); }
};

module.exports = exports;

