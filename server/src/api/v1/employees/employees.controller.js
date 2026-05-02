const service = require('./employees.service');
const usersService = require('../users/users.service');


exports.list = async (req, res, next) => {
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

// Administrative routes
exports.create = async (req, res, next) => {
  try {
    // HR Officer restriction: cannot create ADMINs
    if (req.user.role === 'HR_OFFICER' && req.body.role === 'ADMIN') {
      const err = new Error('HR Officers cannot create administrator accounts');
      err.status = 403;
      throw err;
    }
    const result = await usersService.createUser(req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const data = req.body;
    // HR Officer restriction: cannot change roles
    if (req.user.role === 'HR_OFFICER' && data.role) {
      delete data.role;
    }
    
    const result = await service.adminUpdateEmployee(req.params.id, data);
    res.json(result);
  } catch (e) { next(e); }
};

exports.sendCredentials = async (req, res, next) => {
  try {
    // Mocked for Phase 1
    res.json({ message: 'Credentials sent to employee email successfully' });
  } catch (e) { next(e); }
};

