const service = require('./employees.service');

exports.list = async (_req, res, next) => {
  try {
    const { search = '', role, limit = 50, offset = 0 } = req.query;
    const result = await service.listEmployees({ 
      search, 
      role, 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    res.json(result);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const employee = await service.getEmployee(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee });
  } catch (e) { next(e); }
};

// Self-service — the authenticated user updates their own profile / bank details.
// Used by the Employee module.
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
