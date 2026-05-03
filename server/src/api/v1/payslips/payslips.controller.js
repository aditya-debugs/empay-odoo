const service = require('./payslips.service');
const calculator = require('../../../domain/payroll/calculator');

// Employee — list own payslips
exports.getPayslips = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await service.getEmployeePayslips(req.user.id, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (e) { next(e); }
};

// Get single payslip — admin/payroll can read any; employee only own.
exports.getPayslipDetail = async (req, res, next) => {
  try {
    const role = req.user.role;
    if (role === 'ADMIN' || role === 'PAYROLL_OFFICER') {
      const payslip = await service.getById(req.params.id);
      if (!payslip) return res.status(404).json({ message: 'Payslip not found' });
      return res.json(payslip);
    }
    const payslip = await service.getOwnPayslip(req.user.id, req.params.id);
    res.json(payslip);
  } catch (e) { next(e); }
};

// Admin/Payroll — list all payslips with optional filters
exports.listAll = async (req, res, next) => {
  try {
    const payslips = await service.listAll({ year: req.query.year, month: req.query.month });
    res.json({ payslips });
  } catch (e) { next(e); }
};

exports.getDraft = async (req, res, next) => {
  try {
    const { employeeId, month } = req.query;
    const draft = await service.getDraft(employeeId, month);
    res.json(draft);
  } catch (e) { next(e); }
};

exports.compute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payslip = await service.getById(id);
    if (!payslip) return res.status(404).json({ message: 'Payslip not found' });

    const monthStr = `${payslip.year}-${String(payslip.month).padStart(2, '0')}`;
    const result = await calculator.processPayrollForEmployee(payslip.employeeId, monthStr);
    res.json(result.payslip);
  } catch (e) { next(e); }
};

exports.validate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payslip = await service.validate(id, req.user.id);
    res.json(payslip);
  } catch (e) { next(e); }
};

exports.cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payslip = await service.cancel(id);
    res.json(payslip);
  } catch (e) { next(e); }
};

exports.createIndividual = async (req, res, next) => {
  try {
    const { employeeId, month } = req.body;
    const result = await calculator.processPayrollForEmployee(employeeId, month);
    res.status(201).json({ payslipId: result.payslip.id });
  } catch (e) { next(e); }
};

module.exports = exports;
