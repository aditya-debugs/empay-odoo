const service = require('./dashboard.service');

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

module.exports = exports;
