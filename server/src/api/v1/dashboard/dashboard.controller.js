const service = require('./dashboard.service');
const repository = require('../../../repositories/payrollRepository');

exports.getDashboard = async (req, res, next) => {
  try {
    const role = req.user.role;
    if (role === 'PAYROLL_OFFICER') {
      const data = await repository.getPayrollDashboardData();
      return res.json(data);
    }
    if (role === 'EMPLOYEE') {
      const data = await service.getEmployeeDashboard(req.user.id);
      return res.json(data);
    }
    if (role === 'ADMIN') {
      const data = await service.getAdminDashboard();
      return res.json(data);
    }
    if (role === 'HR_OFFICER') {
      const data = await service.getHRDashboard();
      return res.json(data);
    }
    res.status(400).json({ error: 'Invalid role for dashboard' });
  } catch (e) { 
    console.error('[Dashboard Controller Error]:', e);
    next(e); 
  }
};

exports.getEmployeeDashboard = async (req, res, next) => {
  try {
    const dashboard = await service.getEmployeeDashboard(req.user.id);
    res.json(dashboard);
  } catch (e) { next(e); }
};

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const dashboard = await service.getAdminDashboard();
    res.json(dashboard);
  } catch (e) { next(e); }
};

exports.getPayrollDashboard = async (req, res, next) => {
  try {
    const dashboard = await service.getPayrollDashboard();
    res.json(dashboard);
  } catch (e) { next(e); }
};

exports.getHRDashboard = async (req, res, next) => {
  try {
    const dashboard = await service.getHRDashboard();
    res.json(dashboard);
  } catch (e) { next(e); }
};

module.exports = exports;
