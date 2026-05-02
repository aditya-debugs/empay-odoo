const service = require('./employees.service');

exports.listEmployees = async (req, res, next) => {
  try {
    const { search = '', limit = 50, offset = 0 } = req.query;
    const result = await service.listEmployees(search, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (e) { next(e); }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await service.getEmployeeProfile(req.params.id);
    res.json({ employee });
  } catch (e) { next(e); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const employee = await service.updateOwnProfile(req.user.id, req.body);
    res.json({ employee });
  } catch (e) { next(e); }
};

exports.updateBankDetails = async (req, res, next) => {
  try {
    const employee = await service.updateBankDetails(req.user.id, req.body);
    res.json({ employee });
  } catch (e) { next(e); }
};

module.exports = exports;

